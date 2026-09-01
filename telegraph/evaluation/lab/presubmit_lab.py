#!/usr/bin/env python3
"""Veridex Track 2 pre-submit laboratory.

Scores a candidate WASM through its real exports against independent shadow
pairs, generated variants, and historical failure replays. This is a local
risk gate; it does not replace Telegraph's hidden Stage-2 evaluation.
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
SEED_CORPUS = LAB_DIR / "shadow_corpus.json"
GENERATED_CORPUS = LAB_DIR / "shadow_corpus.generated.json"
HISTORY_PATH = LAB_DIR / "historical_failures.json"
OFFICIAL_BENCHMARK = LAB_DIR.parent / "track2-benchmark-v2.json"


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


def ensure_generated(rounds: int) -> Path:
    if GENERATED_CORPUS.exists():
        try:
            data = json.loads(GENERATED_CORPUS.read_text(encoding="utf-8"))
            if int(data.get("rounds", 0)) >= rounds and data.get("cases"):
                return GENERATED_CORPUS
        except (ValueError, OSError, json.JSONDecodeError):
            pass
    proc = run([sys.executable, str(LAB_DIR / "generate_shadow_corpus.py"), "--out", str(GENERATED_CORPUS), "--rounds", str(rounds)], timeout=120)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "shadow corpus generation failed")
    return GENERATED_CORPUS


def score_records(wasm: Path, records: list[dict], mode: str) -> list[dict]:
    payload = json.dumps(records, ensure_ascii=False)
    js = r'''
import fs from 'node:fs';
const wasmPath=process.argv[2], mode=process.argv[3];
const records=JSON.parse(fs.readFileSync(0,'utf8')), wasm=fs.readFileSync(wasmPath);
const {module,instance}=await WebAssembly.instantiate(wasm,{}), e=instance.exports;
for(const n of ['memory','alloc','dealloc','rank_answer']) if(!(n in e)) throw new Error(`missing export ${n}`);
if(WebAssembly.Module.imports(module).length) throw new Error('imports present');
const enc=new TextEncoder();
function score(q,gt,a){const qb=enc.encode(q),gb=enc.encode(gt),ab=enc.encode(a);const qp=e.alloc(qb.length),gp=e.alloc(gb.length),ap=e.alloc(ab.length);try{const m=new Uint8Array(e.memory.buffer);for(const[p,b]of[[qp,qb],[gp,gb],[ap,ab]]){if(p<0||p>m.length||b.length>m.length-p)throw new Error('memory bounds');m.set(b,p);}const s=e.rank_answer(qp,qb.length,gp,gb.length,ap,ab.length);if(!Number.isFinite(s)||s<0||s>1)throw new Error(`invalid score ${s}`);return s;}finally{e.dealloc(ap,ab.length);e.dealloc(gp,gb.length);e.dealloc(qp,qb.length);}}
const out=[];for(const r of records){if(mode==='pairs')out.push({...r,goodScore:score(r.question,r.ground_truth,r.good),badScore:score(r.question,r.ground_truth,r.bad)});else out.push({...r,referenceScore:score(r.question,r.ground_truth,r.reference),variantScore:score(r.question,r.ground_truth,r.variant)});}console.log(JSON.stringify(out));
'''
    proc = run(["node","--input-type=module","-e",js,str(wasm),mode], input_text=payload, timeout=1800)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "WASM scoring failed")
    return json.loads(proc.stdout)


def summarize(rows: list[dict]) -> dict:
    values=sorted(r["goodScore"]-r["badScore"] for r in rows); n=len(values)
    return {"pairs":n,"inversions":sum(v<=0 for v in values),
            "mean_margin":statistics.fmean(values) if values else 0.0,
            "median_margin":statistics.median(values) if values else 0.0,
            "p10_margin":values[max(0,math.floor(n*.10))] if values else 0.0,
            "p5_margin":values[max(0,math.floor(n*.05))] if values else 0.0,
            "worst_margin":values[0] if values else 0.0,
            "near_ties_lt_0_02":sum(0<v<.02 for v in values),
            "near_ties_lt_0_05":sum(0<v<.05 for v in values)}


def summarize_invariance(rows: list[dict]) -> dict:
    ds=[abs(r["referenceScore"]-r["variantScore"]) for r in rows]
    return {"variants":len(ds),"mean_abs_delta":statistics.fmean(ds) if ds else 0.0,
            "max_abs_delta":max(ds,default=0.0),"severe_changes_gt_0_10":sum(d>.10 for d in ds)}


def classify(kind:str)->str:
    k=kind.lower()
    if any(x in k for x in ("polarity","direction","contradiction","binary")): return "polarity"
    if "entity" in k: return "entity"
    if "number" in k or "numeric" in k: return "numeric"
    if "incomplete" in k or "distractor" in k: return "completeness"
    return "semantic"


def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("wasm",type=Path)
    ap.add_argument("--strict",action="store_true")
    ap.add_argument("--json",action="store_true")
    ap.add_argument("--rounds",type=int,default=12)
    ap.add_argument("--out",type=Path)
    args=ap.parse_args()
    if not args.wasm.exists(): print(f"candidate not found: {args.wasm}",file=sys.stderr); return 2
    st=structural_probe(args.wasm)
    if not st["available"] and args.strict: print(json.dumps(st)); return 2
    if st.get("imports") not in (0,None): print("RED: imports present"); return 2

    generated_path=ensure_generated(max(1,args.rounds))
    generated=json.loads(generated_path.read_text(encoding="utf-8"))["cases"]
    historical=json.loads(HISTORY_PATH.read_text(encoding="utf-8"))["cases"]
    seed=json.loads(SEED_CORPUS.read_text(encoding="utf-8"))["cases"]

    shadow=score_records(args.wasm,generated,"pairs")
    replay=score_records(args.wasm,historical,"pairs")
    invariants=[]
    # Derive a modest invariance slice from the independent seeds so the lab
    # remains strict without turning harmless formatting into a rejection.
    for c in seed:
        good=c["good"]
        for variant in (good.lower(),re.sub(r"[,.!?;:]+","",good),"According to the record, "+good,good+" as reported"):
            if variant!=good:
                invariants.append({"question":c["question"],"ground_truth":c["ground_truth"],"reference":good,"variant":variant})
    inv=score_records(args.wasm,invariants,"invariance") if invariants else []
    s,h,i=summarize(shadow),summarize(replay),summarize_invariance(inv)
    buckets={}
    for r in shadow:
        if r["goodScore"]-r["badScore"]<=0:
            k=classify(r.get("kind","")); buckets[k]=buckets.get(k,0)+1
    verdict="GREEN"
    if s["inversions"] or h["inversions"]: verdict="RED"
    elif s["mean_margin"]<.20 or s["p10_margin"]<.05 or i["max_abs_delta"]>.20: verdict="YELLOW"
    result={"verdict":verdict,"artifact":{**st,"sha256":sha256(args.wasm)},"shadow":s,"historical_replay":h,
            "equivalence_invariance":i,"failure_buckets":buckets,
            "corpus":{"shadow_pairs":len(shadow),"historical_pairs":len(historical),"invariance_variants":len(inv),"rounds":args.rounds},
            "policy":{"recommended_mean_margin":.20,"recommended_p10_margin":.05,"required_inversions":0,
                      "telegraph_hidden_stage2_not_predictable":True},
            "worst_shadow_pairs":sorted(shadow,key=lambda r:r["goodScore"]-r["badScore"])[:25]}
    if args.out: args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    print(json.dumps(result,indent=2,ensure_ascii=False) if args.json else human(result))
    return 0 if verdict=="GREEN" else (1 if args.strict else 0)


def human(r:dict)->str:
    s,h,i=r["shadow"],r["historical_replay"],r["equivalence_invariance"]
    return "\n".join(["VERIDEX TRACK-2 PRE-SUBMIT LAB","="*38,f"Verdict          : {r['verdict']}",
      f"SHA256           : {r['artifact']['sha256']}",f"Bytes            : {r['artifact']['bytes']}",f"Imports          : {r['artifact']['imports']}","",
      f"Shadow pairs     : {s['pairs']}",f"Inversions       : {s['inversions']}",f"Mean margin      : {s['mean_margin']:.6f}",
      f"P10 margin       : {s['p10_margin']:.6f}",f"Worst margin     : {s['worst_margin']:.6f}",f"Near-ties <.02   : {s['near_ties_lt_0_02']}",
      f"Historical inv.  : {h['inversions']}",f"Equiv max delta  : {i['max_abs_delta']:.6f}","",
      "GREEN = low local pre-registration risk; YELLOW = review stop; RED = do not register.",
      "The hidden Telegraph Stage-2 benchmark remains independent."])


if __name__=="__main__": raise SystemExit(main())
