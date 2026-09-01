#!/usr/bin/env python3
"""Veridex Track 2 pre-submit laboratory.

A candidate WASM is scored directly through its real exports. The lab adds an
independent shadow corpus, deterministic adversarial mutations, historical
failure replay, and semantic-invariance checks. It is deliberately separate
from Telegraph's hidden Stage-2 benchmark and never changes official gates.
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
        y = x + (max(1.0, abs(x) * 0.10) if abs(x) >= 1000 else 1.0)
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
    return " ".join(words[:max(2, min(len(words) - 1, len(words) // 2))])


def late_contradiction(text: str) -> str:
    return text.rstrip(" .!?;") + ", but that conclusion was later shown to be false."


def distract(text: str) -> str:
    return text.rstrip(" .!?;") + ". Unrelated background information about another topic is also available."


def surface_wrap(text: str, round_id: int) -> str:
    wrappers = [
        lambda x: x,
        lambda x: "According to the report, " + x,
        lambda x: "The available evidence indicates that " + x,
        lambda x: "In the reported incident, " + x,
        lambda x: "Based on the stated facts, " + x,
        lambda x: x + " as reported in the available record.",
        lambda x: "The final reported finding was: " + x,
        lambda x: "For the relevant event, " + x,
        lambda x: "The security review states that " + x,
        lambda x: "After review of the evidence, " + x,
        lambda x: "In plain terms, " + x,
        lambda x: "The record supports the following answer: " + x,
    ]
    return wrappers[round_id % len(wrappers)](text)


def build_shadow_cases(rounds: int) -> tuple[list[dict], list[dict]]:
    raw = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    seeds = raw["cases"]
    pairs: list[dict] = []
    invariants: list[dict] = []
    seen: set[tuple[str, str, str, str, str]] = set()
    for c in seeds:
        q, gt, good = c["question"], c["ground_truth"], c["good"]
        mutations = [
            ("number", mutate_number(good)),
            ("polarity", swap_polarity(good)),
            ("entity", swap_entity(good)),
            ("incomplete", incomplete(good)),
            ("late-contradiction", late_contradiction(good)),
            ("distractor", distract(good)),
        ]
        mutations.append(("double", late_contradiction(mutate_number(good))))
        for round_id in range(max(1, rounds)):
            sq = surface_wrap(q, round_id)
            sgt = surface_wrap(gt, round_id) if round_id % 3 == 0 else gt
            sgood = surface_wrap(good, round_id)
            for kind, bad in mutations:
                sbad = surface_wrap(bad, round_id)
                if sbad == sgood:
                    continue
                key = (sq, sgt, sgood, sbad, kind)
                if key in seen:
                    continue
                pairs.append({"question": sq, "ground_truth": sgt, "good": sgood, "bad": sbad,
                              "kind": f"shadow-{kind}", "critical": bool(c.get("critical"))})
                seen.add(key)
            for i in range(4):
                variant = surface_wrap(good.lower() if i == 0 else re.sub(r"[,.!?;:]+", "", good), round_id)
                if i == 2:
                    variant = surface_wrap("According to the report, " + good, round_id)
                elif i == 3:
                    variant = surface_wrap(good + " (as reported)", round_id)
                if variant != sgood:
                    invariants.append({"question": sq, "ground_truth": sgt, "reference": sgood,
                                       "variant": variant, "kind": f"equiv-round-{round_id}-{i}"})
    return pairs, invariants


def scorer_js(wasm: Path, records: list[dict], mode: str) -> list[dict]:
    payload = json.dumps(records, ensure_ascii=False)
    js = r'''
import fs from 'node:fs';
const wasmPath = process.argv[2]; const mode = process.argv[3];
const records = JSON.parse(fs.readFileSync(0, 'utf8')); const wasm = fs.readFileSync(wasmPath);
const { module, instance } = await WebAssembly.instantiate(wasm, {}); const e = instance.exports;
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
    if(!Number.isFinite(s) || s<0 || s>1) throw new Error(`invalid score ${s}`); return s;
  } finally { e.dealloc(ap,ab.length); e.dealloc(gp,gb.length); e.dealloc(qp,qb.length); }
}
const out=[];
for(const r of records) {
  if(mode==='pairs') out.push({...r, goodScore:score(r.question,r.ground_truth,r.good), badScore:score(r.question,r.ground_truth,r.bad)});
  else out.push({...r, referenceScore:score(r.question,r.ground_truth,r.reference), variantScore:score(r.question,r.ground_truth,r.variant)});
}
console.log(JSON.stringify(out));
'''
    proc = run(["node", "--input-type=module", "-e", js, str(wasm), mode], input_text=payload, timeout=1200)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "WASM scorer failed")
    return json.loads(proc.stdout)


def summarize_margins(rows: list[dict]) -> dict:
    margins = sorted(r["goodScore"] - r["badScore"] for r in rows)
    n = len(margins)
    return {"pairs": n, "inversions": sum(x <= 0 for x in margins),
            "mean_margin": statistics.fmean(margins) if margins else 0.0,
            "median_margin": statistics.median(margins) if margins else 0.0,
            "p10_margin": margins[max(0, math.floor(n*.10))] if n else 0.0,
            "p5_margin": margins[max(0, math.floor(n*.05))] if n else 0.0,
            "worst_margin": margins[0] if margins else 0.0,
            "near_ties_lt_0_02": sum(0 < x < .02 for x in margins),
            "near_ties_lt_0_05": sum(0 < x < .05 for x in margins)}


def summarize_invariance(rows: list[dict]) -> dict:
    ds = [abs(r["referenceScore"] - r["variantScore"]) for r in rows]
    return {"variants": len(ds), "mean_abs_delta": statistics.fmean(ds) if ds else 0.0,
            "max_abs_delta": max(ds, default=0.0), "severe_changes_gt_0_10": sum(d > .10 for d in ds)}


def classify(kind: str) -> str:
    k = kind.lower()
    if any(x in k for x in ("polarity", "direction", "contradiction", "binary")): return "polarity"
    if "entity" in k: return "entity"
    if "number" in k or "numeric" in k: return "numeric"
    if "incomplete" in k or "distractor" in k: return "completeness"
    return "semantic"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("wasm", type=Path)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--rounds", type=int, default=12, help="surface-diversity rounds; 12 produces ~1.6k shadow pairs from 20 seeds")
    ap.add_argument("--out", type=Path, help="write machine-readable report JSON")
    args = ap.parse_args()
    if not args.wasm.exists():
        print(f"candidate not found: {args.wasm}", file=sys.stderr); return 2
    structural = structural_probe(args.wasm)
    if not structural["available"] and args.strict: return 2
    if structural.get("imports") not in (0, None): return 2

    shadow, invariants = build_shadow_cases(max(1, args.rounds))
    historical = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))["cases"]
    shadow_scored = scorer_js(args.wasm, shadow, "pairs")
    historical_scored = scorer_js(args.wasm, historical, "pairs")
    invariant_scored = scorer_js(args.wasm, invariants, "invariance")
    s, h, inv = summarize_margins(shadow_scored), summarize_margins(historical_scored), summarize_invariance(invariant_scored)
    failures: dict[str, int] = {}
    for r in shadow_scored:
        if r["goodScore"] - r["badScore"] <= 0:
            k = classify(r["kind"]); failures[k] = failures.get(k, 0) + 1
    verdict = "GREEN"
    if s["inversions"] or h["inversions"]: verdict = "RED"
    elif s["mean_margin"] < .20 or s["p10_margin"] < .05 or inv["max_abs_delta"] > .20: verdict = "YELLOW"
    result = {"verdict": verdict, "artifact": {**structural, "sha256": sha256(args.wasm)},
              "shadow": s, "historical_replay": h, "equivalence_invariance": inv,
              "failure_buckets": failures,
              "corpus": {"shadow_pairs": len(shadow), "historical_pairs": len(historical), "invariance_variants": len(invariants)},
              "policy": {"recommended_mean_margin": .20, "recommended_p10_margin": .05,
                         "required_inversions": 0, "hidden_stage2_not_predictable": True},
              "worst_shadow_pairs": sorted(shadow_scored, key=lambda r:r["goodScore"]-r["badScore"])[:25]}
    if args.out: args.out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False) if args.json else human(result))
    return 0 if verdict == "GREEN" else (1 if args.strict else 0)


def human(r: dict) -> str:
    s,h,i = r["shadow"],r["historical_replay"],r["equivalence_invariance"]
    return "\n".join([
      "VERIDEX TRACK-2 PRE-SUBMIT LAB", "="*38,
      f"Verdict          : {r['verdict']}", f"SHA256           : {r['artifact']['sha256']}",
      f"Bytes            : {r['artifact']['bytes']}", f"Imports          : {r['artifact']['imports']}", "",
      f"Shadow pairs     : {s['pairs']}", f"Inversions       : {s['inversions']}",
      f"Mean margin      : {s['mean_margin']:.6f}", f"P10 margin       : {s['p10_margin']:.6f}",
      f"P5 margin        : {s['p5_margin']:.6f}", f"Worst margin     : {s['worst_margin']:.6f}",
      f"Near-ties <.02   : {s['near_ties_lt_0_02']}", f"Historical inv.  : {h['inversions']}",
      f"Equiv max delta  : {i['max_abs_delta']:.6f}", "",
      "GREEN = safe to consider registration; YELLOW = review stop; RED = do not register.",
      "This remains a local risk model, not a prediction of Telegraph's hidden Stage-2 result.",
    ])


if __name__ == "__main__":
    raise SystemExit(main())
