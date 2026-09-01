#!/usr/bin/env python3
"""Veridex Track 2 pre-submit laboratory.

This lab is a local risk harness. It never replaces Telegraph's official
validator, hidden benchmark, or public Wazero checker. It scores through the
candidate WASM itself and fails closed in --strict mode.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import statistics
import subprocess
import sys
from pathlib import Path

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
    proc = run(["wasm-objdump", "-x", str(wasm)], timeout=30)
    if proc.returncode != 0:
        result["error"] = (proc.stderr or proc.stdout).strip()[:500]
        return result
    text = proc.stdout
    result["available"] = True
    result["imports"] = len(re.findall(r"^Import\[", text, re.MULTILINE)) if "Import[" in text else 0
    result["exports"] = sorted(set(re.findall(r"- func\[\d+\] <([^>]+)>", text)))
    return result


def mutate_number(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        raw = match.group(1)
        try:
            x = float(raw.replace(",", ""))
        except ValueError:
            return raw
        if abs(x) >= 1000:
            y = x + max(1, abs(x) * 0.10)
        else:
            y = x + 1
        return str(int(y)) if y.is_integer() else f"{y:g}"
    out = re.sub(r"\b(\d+(?:[.,]\d+)?)\b", repl, text, count=1)
    return out if out != text else text + " 1"


def swap_polarity(text: str) -> str:
    swaps = [
        ("approved", "rejected"), ("authorized", "unauthorized"), ("allowed", "blocked"),
        ("confirmed", "denied"), ("safe", "unsafe"), ("legitimate", "fraudulent"),
        ("genuine", "counterfeit"), ("increased", "decreased"), ("increase", "decrease"),
        ("rose", "fell"), ("rising", "falling"), ("positive", "negative"),
        ("bullish", "bearish"), ("compromised", "secure"), ("trusted", "malicious"),
        ("yes", "no"), ("true", "false"), ("reduced", "increased"), ("declined", "increased"),
    ]
    for a, b in swaps:
        m = re.search(rf"\b{re.escape(a)}\b", text, re.I)
        if m:
            return text[:m.start()] + b + text[m.end():]
    return "not " + text


def swap_entity(text: str) -> str:
    swaps = [("Apple", "Microsoft"), ("Microsoft", "Apple"), ("Ethereum", "Solana"),
             ("Solana", "Ethereum"), ("Coinbase", "Binance"), ("Binance", "Coinbase"),
             ("Kraken", "Coinbase"), ("OpenAI", "Google"), ("Google", "OpenAI")]
    for a, b in swaps:
        m = re.search(rf"\b{re.escape(a)}\b", text, re.I)
        if m:
            return text[:m.start()] + b + text[m.end():]
    return text + " unrelated entity"


def incomplete(text: str) -> str:
    words = text.split()
    if len(words) <= 2:
        return text + " …"
    cut = max(2, min(len(words) - 1, len(words) // 2))
    return " ".join(words[:cut])


def late_contradiction(text: str) -> str:
    return text.rstrip(" .!?;") + ", but that conclusion was later shown to be false."


def distract(text: str) -> str:
    return text.rstrip(" .!?;") + ". Unrelated background information about another topic is also available."


def build_shadow_cases() -> tuple[list[dict], list[dict]]:
    raw = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    seeds = raw["cases"]
    pairs: list[dict] = []
    invariants: list[dict] = []
    seen: set[tuple[str, str, str, str, str]] = set()
    for c in seeds:
        q, gt, good = c["question"], c["ground_truth"], c["good"]
        transforms = [
            ("number", mutate_number(good)),
            ("polarity", swap_polarity(good)),
            ("entity", swap_entity(good)),
            ("incomplete", incomplete(good)),
            ("late-contradiction", late_contradiction(good)),
            ("distractor", distract(good)),
            ("double", late_contradiction(mutate_number(good))),
        ]
        for kind, bad in transforms:
            if bad == good:
                continue
            key = (q, gt, good, bad, kind)
            if key not in seen:
                pairs.append({"question": q, "ground_truth": gt, "good": good, "bad": bad,
                              "kind": f"shadow-{kind}", "critical": bool(c.get("critical"))})
                seen.add(key)
        equiv = [
            good.lower(),
            re.sub(r"[,.!?;:]+", "", good),
            "According to the report, " + good,
            good + " (as reported)",
        ]
        for i, variant in enumerate(equiv):
            if variant != good:
                invariants.append({"question": q, "ground_truth": gt, "reference": good,
                                   "variant": variant, "kind": f"equiv-{i}"})
    return pairs, invariants


def scorer_js(wasm: Path, records: list[dict], mode: str = "pairs") -> list[dict]:
    payload = json.dumps(records, ensure_ascii=False)
    js = r'''
import fs from 'node:fs';
const wasmPath = process.argv[2];
const mode = process.argv[3];
const records = JSON.parse(fs.readFileSync(0, 'utf8'));
const wasm = fs.readFileSync(wasmPath);
const { module, instance } = await WebAssembly.instantiate(wasm, {});
const e = instance.exports;
for (const name of ['memory','alloc','dealloc','rank_answer']) if (!(name in e)) throw new Error(`missing export ${name}`);
if (WebAssembly.Module.imports(module).length) throw new Error('imports present');
const enc = new TextEncoder();
function score(q, gt, a) {
  const qb=enc.encode(q), gb=enc.encode(gt), ab=enc.encode(a);
  const qp=e.alloc(qb.length), gp=e.alloc(gb.length), ap=e.alloc(ab.length);
  try {
    const mem=new Uint8Array(e.memory.buffer);
    for(const [p,b] of [[qp,qb],[gp,gb],[ap,ab]]) { if(p<0 || p>mem.length || b.length>mem.length-p) throw new Error('memory bounds'); mem.set(b,p); }
    const s=e.rank_answer(qp,qb.length,gp,gb.length,ap,ab.length);
    if(!Number.isFinite(s) || s<0 || s>1) throw new Error(`invalid score ${s}`);
    return s;
  } finally { e.dealloc(ap,ab.length); e.dealloc(gp,gb.length); e.dealloc(qp,qb.length); }
}
const out=[];
for(const r of records) {
  if(mode==='pairs') out.push({...r, goodScore:score(r.question,r.ground_truth,r.good), badScore:score(r.question,r.ground_truth,r.bad)});
  else out.push({...r, referenceScore:score(r.question,r.ground_truth,r.reference), variantScore:score(r.question,r.ground_truth,r.variant)});
}
console.log(JSON.stringify(out));
'''
    proc = run(["node", "--input-type=module", "-e", js, str(wasm), mode], input_text=payload, timeout=600)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "WASM scorer failed")
    return json.loads(proc.stdout)


def summarize_margins(rows: list[dict]) -> dict:
    margins = sorted(r["goodScore"] - r["badScore"] for r in rows)
    n = len(margins)
    return {
        "pairs": n,
        "inversions": sum(x <= 0 for x in margins),
        "mean_margin": statistics.fmean(margins) if margins else 0.0,
        "median_margin": statistics.median(margins) if margins else 0.0,
        "p10_margin": margins[max(0, math.floor(n * .10))] if n else 0.0,
        "p5_margin": margins[max(0, math.floor(n * .05))] if n else 0.0,
        "worst_margin": margins[0] if margins else 0.0,
        "near_ties_lt_0_02": sum(0 < x < .02 for x in margins),
        "near_ties_lt_0_05": sum(0 < x < .05 for x in margins),
    }


def summarize_invariance(rows: list[dict]) -> dict:
    deltas = [abs(r["referenceScore"] - r["variantScore"]) for r in rows]
    return {
        "variants": len(deltas),
        "mean_abs_delta": statistics.fmean(deltas) if deltas else 0.0,
        "max_abs_delta": max(deltas, default=0.0),
        "severe_changes_gt_0_10": sum(d > .10 for d in deltas),
    }


def classify(kind: str) -> str:
    k = kind.lower()
    if "polarity" in k or "direction" in k or "contradiction" in k or "binary" in k: return "polarity"
    if "entity" in k: return "entity"
    if "number" in k or "numeric" in k: return "numeric"
    if "incomplete" in k or "distractor" in k: return "completeness"
    return "semantic"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("wasm", type=Path)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    if not args.wasm.exists():
        print(f"candidate not found: {args.wasm}", file=sys.stderr); return 2

    structural = structural_probe(args.wasm)
    if not structural["available"] and args.strict:
        print(json.dumps(structural, indent=2)); return 2
    if structural.get("imports") not in (0, None):
        print("RED: imports present"); return 2

    shadow, invariants = build_shadow_cases()
    historical = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))["cases"]
    shadow_scored = scorer_js(args.wasm, shadow)
    historical_scored = scorer_js(args.wasm, historical)
    invariant_scored = scorer_js(args.wasm, invariants, mode="invariance") if invariants else []

    s = summarize_margins(shadow_scored)
    hs = summarize_margins(historical_scored)
    inv = summarize_invariance(invariant_scored)
    buckets: dict[str, int] = {}
    for r in shadow_scored:
        m = r["goodScore"] - r["badScore"]
        if m <= 0:
            k = classify(r["kind"]); buckets[k] = buckets.get(k, 0) + 1

    verdict = "GREEN"
    if s["inversions"] or hs["inversions"]:
        verdict = "RED"
    elif s["mean_margin"] < .20 or s["p10_margin"] < .05:
        verdict = "YELLOW"
    elif inv["max_abs_delta"] > .20:
        verdict = "YELLOW"

    result = {
        "verdict": verdict,
        "artifact": {**structural, "sha256": sha256(args.wasm)},
        "shadow": s,
        "historical_replay": hs,
        "equivalence_invariance": inv,
        "failure_buckets": buckets,
        "corpus": {"shadow_pairs": len(shadow), "historical_pairs": len(historical), "invariance_variants": len(invariants)},
        "policy": {
            "recommended_mean_margin": .20,
            "recommended_p10_margin": .05,
            "required_inversions": 0,
            "telegraph_hidden_stage2_is_not_predictable": True,
        },
        "worst_shadow_pairs": sorted(shadow_scored, key=lambda r: r["goodScore"] - r["badScore"])[:20],
    }
    print(json.dumps(result, indent=2, ensure_ascii=False) if args.json else human(result))
    return 0 if verdict == "GREEN" else (1 if args.strict else 0)


def human(r: dict) -> str:
    s, h, i = r["shadow"], r["historical_replay"], r["equivalence_invariance"]
    return "\n".join([
        "VERIDEX TRACK-2 PRE-SUBMIT LAB",
        "=" * 38,
        f"Verdict          : {r['verdict']}",
        f"SHA256           : {r['artifact']['sha256']}",
        f"Bytes            : {r['artifact']['bytes']}",
        f"Imports          : {r['artifact']['imports']}",
        "",
        f"Shadow pairs     : {s['pairs']}",
        f"Inversions       : {s['inversions']}",
        f"Mean margin      : {s['mean_margin']:.6f}",
        f"P10 margin       : {s['p10_margin']:.6f}",
        f"Worst margin     : {s['worst_margin']:.6f}",
        f"Near-ties <.02   : {s['near_ties_lt_0_02']}",
        f"Historical inv.  : {h['inversions']}",
        f"Equiv max delta  : {i['max_abs_delta']:.6f}",
        "",
        "VERDICT: do not register a RED candidate; treat YELLOW as a review stop.",
    ])


if __name__ == "__main__":
    raise SystemExit(main())
