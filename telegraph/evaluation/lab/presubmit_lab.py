#!/usr/bin/env python3
"""Veridex Track 2 pre-submit laboratory.

This is an advisory/release-gating harness for locally built WASM candidates.
It deliberately does not change Telegraph's evaluator, thresholds, or hidden
Stage-2 benchmark. The purpose is to catch regressions before registration.

Usage:
  python3 telegraph/evaluation/lab/presubmit_lab.py path/to/candidate.wasm
  python3 ... --strict path/to/candidate.wasm
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import statistics
import subprocess
import sys
import tempfile
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[3]
LAB_DIR = Path(__file__).resolve().parent
CORPUS_PATH = LAB_DIR / "shadow_corpus.json"
HISTORY_PATH = LAB_DIR / "historical_failures.json"


def run(cmd: list[str], *, input_text: str | None = None, timeout: int = 180) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, input=input_text, text=True, capture_output=True, timeout=timeout, check=False)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def structural_probe(wasm: Path) -> dict:
    result = {"available": False, "imports": None, "exports": [], "bytes": wasm.stat().st_size}
    objdump = "wasm-objdump"
    proc = run([objdump, "-x", str(wasm)], timeout=30)
    if proc.returncode != 0:
        result["error"] = (proc.stderr or proc.stdout).strip()[:500]
        return result
    result["available"] = True
    text = proc.stdout
    result["imports"] = len(re.findall(r"^Import\[", text, re.MULTILINE)) if "Import[" in text else 0
    exports = re.findall(r"- func\[(\d+)\] <([^>]+)>", text)
    result["exports"] = sorted({name for _, name in exports})
    return result


def make_cases() -> list[dict]:
    raw = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    cases = list(raw["cases"])
    seen = {(c["question"], c["ground_truth"], c["good"], c["bad"], c["kind"]) for c in cases}
    out = list(cases)

    # Deterministic metamorphic expansion. These are deliberately independent
    # from the official benchmark so the local suite is harder than the seed.
    for c in raw.get("templates", []):
        q, gt, good = c["question"], c["ground_truth"], c["good"]
        variants = []
        variants.append(("casefold", good.lower()))
        variants.append(("punctuation", re.sub(r"[,.!?;:]+", "", good)))
        variants.append(("lead-filler", "According to the report, " + good))
        variants.append(("tail-filler", good + " The surrounding context is not material to the answer."))
        variants.append(("wrong-negation", "Not true: " + good))
        variants.append(("late-negation", good + " but this conclusion was later shown to be false."))
        for kind, bad in variants:
            if bad == good:
                continue
            key = (q, gt, good, bad, kind)
            if key in seen:
                continue
            # Positive metamorphic cases are represented separately below.
            out.append({"question": q, "ground_truth": gt, "good": good, "bad": bad, "kind": kind})
            seen.add(key)

    return out


def scorer_js(wasm: Path, cases: list[dict]) -> dict:
    """Score cases through the actual candidate WASM using Node, no reimplementation."""
    payload = json.dumps(cases, ensure_ascii=False)
    js = r'''
import fs from 'node:fs';
const wasmPath = process.argv[2];
const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
const wasm = fs.readFileSync(wasmPath);
const { module, instance } = await WebAssembly.instantiate(wasm, {});
const e = instance.exports;
for (const name of ['memory','alloc','dealloc','rank_answer']) {
  if (!(name in e)) throw new Error(`missing export ${name}`);
}
if (WebAssembly.Module.imports(module).length) throw new Error('imports present');
const enc = new TextEncoder();
function score(q, gt, a) {
  const qb=enc.encode(q), gb=enc.encode(gt), ab=enc.encode(a);
  const qp=e.alloc(qb.length), gp=e.alloc(gb.length), ap=e.alloc(ab.length);
  try {
    const mem=new Uint8Array(e.memory.buffer);
    for(const [p,b] of [[qp,qb],[gp,gb],[ap,ab]]) {
      if(p<0 || p>mem.length || b.length>mem.length-p) throw new Error('memory bounds');
      mem.set(b,p);
    }
    const s=e.rank_answer(qp,qb.length,gp,gb.length,ap,ab.length);
    if(!Number.isFinite(s) || s<0 || s>1) throw new Error(`invalid score ${s}`);
    return s;
  } finally { e.dealloc(ap,ab.length); e.dealloc(gp,gb.length); e.dealloc(qp,qb.length); }
}
const out=[];
for(const c of cases){ out.push({...c, goodScore:score(c.question,c.ground_truth,c.good), badScore:score(c.question,c.ground_truth,c.bad)}); }
console.log(JSON.stringify({out}));
'''
    proc = run(["node", "--input-type=module", "-e", js, str(wasm)], input_text=payload, timeout=300)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "WASM scorer failed")
    return json.loads(proc.stdout)


def historical_checks() -> list[dict]:
    return json.loads(HISTORY_PATH.read_text(encoding="utf-8"))["cases"]


def summarize(rows: list[dict]) -> dict:
    margins = [r["goodScore"] - r["badScore"] for r in rows]
    margins_sorted = sorted(margins)
    n = len(margins)
    p10 = margins_sorted[max(0, math.floor(n * 0.10))] if n else 0.0
    p5 = margins_sorted[max(0, math.floor(n * 0.05))] if n else 0.0
    return {
        "pairs": n,
        "inversions": sum(1 for x in margins if x <= 0),
        "mean_margin": statistics.fmean(margins) if margins else 0.0,
        "median_margin": statistics.median(margins) if margins else 0.0,
        "p10_margin": p10,
        "p5_margin": p5,
        "worst_margin": margins_sorted[0] if margins else 0.0,
        "near_ties_lt_0_02": sum(1 for x in margins if 0 < x < 0.02),
        "near_ties_lt_0_05": sum(1 for x in margins if 0 < x < 0.05),
    }


def classify_failure(row: dict) -> str:
    kind = row.get("kind", "")
    if "negation" in kind or "direction" in kind or "opposite" in kind:
        return "polarity"
    if "entity" in kind:
        return "entity"
    if "number" in kind or "numeric" in kind:
        return "numeric"
    if "tail" in kind or "filler" in kind or "under" in kind:
        return "completeness"
    return "semantic"


def report(rows: list[dict], historical_rows: list[dict], structural: dict) -> dict:
    normal = summarize(rows)
    critical = [r for r in rows if r.get("critical", False)]
    critical_summary = summarize(critical) if critical else {"pairs": 0, "inversions": 0}
    failures = [r for r in rows if r["goodScore"] - r["badScore"] <= 0]
    buckets: dict[str, dict] = {}
    for r in failures:
        k = classify_failure(r)
        buckets.setdefault(k, {"failures": 0})["failures"] += 1
    history_summary = summarize(historical_rows) if historical_rows else {"pairs": 0, "inversions": 0}
    return {
        "artifact": structural,
        "shadow": normal,
        "critical": critical_summary,
        "historical_replay": history_summary,
        "failure_buckets": buckets,
        "verdict": "RED" if normal["inversions"] or critical_summary.get("inversions", 0) else ("YELLOW" if normal["mean_margin"] < 0.20 or normal["p10_margin"] < 0.05 else "GREEN"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("wasm", type=Path)
    ap.add_argument("--strict", action="store_true", help="fail on any missing mandatory local capability")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="cap generated shadow pairs for quick iteration")
    args = ap.parse_args()

    if not args.wasm.exists():
        print(f"candidate not found: {args.wasm}", file=sys.stderr)
        return 2

    structural = structural_probe(args.wasm)
    if not structural["available"] and args.strict:
        print(json.dumps(structural, indent=2), file=sys.stderr)
        return 2
    if structural.get("imports") not in (0, None):
        return 2

    cases = make_cases()
    historical = historical_checks()
    # Historical records are fixed GOOD/BAD pairs; score them against the candidate too.
    all_cases = cases + historical
    if args.limit:
        all_cases = all_cases[:args.limit]
    scored = scorer_js(args.wasm, all_cases)["out"]
    shadow = scored[: len(cases)] if len(scored) >= len(cases) else scored
    replay = scored[len(cases):] if len(scored) > len(cases) else []
    result = report(shadow, replay, structural)
    result["sha256"] = sha256(args.wasm)
    result["corpus"] = {"shadow_cases": len(cases), "historical_cases": len(historical)}
    result["policy"] = {
        "telegraph_hidden_stage2_not_predictable": True,
        "local_green_is_not_live_acceptance": True,
        "recommended_mean_margin": 0.20,
        "recommended_p10_margin": 0.05,
        "recommended_inversions": 0,
    }
    result["top_failures"] = sorted(
        shadow,
        key=lambda r: r["goodScore"] - r["badScore"],
    )[:15]
    print(json.dumps(result, indent=2, ensure_ascii=False) if args.json else format_human(result))
    verdict = result["verdict"]
    return 0 if verdict == "GREEN" else (1 if args.strict else 0)


def format_human(r: dict) -> str:
    s = r["shadow"]
    c = r["critical"]
    h = r["historical_replay"]
    return "\n".join([
        "VERIDEX TRACK-2 PRE-SUBMIT LAB",
        "=" * 36,
        f"Artifact SHA256 : {r['sha256']}",
        f"Artifact bytes  : {r['artifact']['bytes']}",
        f"Imports         : {r['artifact']['imports']}",
        "",
        f"Shadow pairs    : {s['pairs']}",
        f"Inversions      : {s['inversions']}",
        f"Mean margin     : {s['mean_margin']:.6f}",
        f"P10 margin      : {s['p10_margin']:.6f}",
        f"P5 margin       : {s['p5_margin']:.6f}",
        f"Worst margin    : {s['worst_margin']:.6f}",
        f"Near ties <.02 : {s['near_ties_lt_0_02']}",
        "",
        f"Critical pairs  : {c.get('pairs',0)}",
        f"Critical inv.   : {c.get('inversions',0)}",
        "",
        f"Historical pairs: {h.get('pairs',0)}",
        f"Historical inv.: {h.get('inversions',0)}",
        "",
        f"VERDICT         : {r['verdict']}",
        "",
        "WARNING: GREEN is a pre-registration risk verdict, not a guarantee of Telegraph Stage 2 acceptance.",
    ])


if __name__ == "__main__":
    raise SystemExit(main())
