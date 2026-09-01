#!/usr/bin/env python3
"""Generate a large independent-style Track 2 shadow corpus.

The official benchmark is consumed as one source slice only; it is never
modified. The generator adds deterministic hard negatives and surface variants
for local pre-registration testing.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OFFICIAL = REPO / "telegraph" / "evaluation" / "track2-benchmark-v2.json"
SEEDS = HERE / "shadow_corpus.json"
DEFAULT_OUT = HERE / "shadow_corpus.generated.json"


def first_number(text: str) -> str | None:
    m = re.search(r"\b\d+(?:[.,]\d+)?\b", text)
    return m.group(0) if m else None


def mutate_number(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        raw = m.group(0); x = float(raw.replace(",", ""))
        y = x + (max(1.0, abs(x) * 0.10) if abs(x) >= 1000 else 1.0)
        return str(int(y)) if y.is_integer() else f"{y:g}"
    out = re.sub(r"\b\d+(?:[.,]\d+)?\b", repl, text, count=1)
    return out if out != text else text + " 1"


def mutate_direction(text: str) -> str:
    pairs = [("approved","rejected"),("authorized","unauthorized"),("allowed","blocked"),("confirmed","denied"),
             ("safe","unsafe"),("legitimate","fraudulent"),("genuine","fake"),("increased","decreased"),
             ("increase","decrease"),("rose","fell"),("rising","falling"),("positive","negative"),
             ("bullish","bearish"),("compromised","secure"),("trusted","malicious"),("yes","no"),("true","false")]
    for a,b in pairs:
        m=re.search(rf"\b{a}\b", text, re.I)
        if m: return text[:m.start()] + b + text[m.end():]
    return "not " + text


def mutate_entity(text: str) -> str:
    pairs=[("Apple","Microsoft"),("Ethereum","Solana"),("Coinbase","Binance"),("Kraken","Coinbase"),("OpenAI","Google")]
    for a,b in pairs:
        m=re.search(rf"\b{a}\b", text, re.I)
        if m: return text[:m.start()] + b + text[m.end():]
    return text + " involving another entity"


def mutate_relation(text: str) -> str:
    swaps=[("issued","received"),("blocked","allowed"),("processed","received"),("reported","denied"),("prevented","caused")]
    for a,b in swaps:
        m=re.search(rf"\b{a}\b", text, re.I)
        if m: return text[:m.start()] + b + text[m.end():]
    return text + " but this statement refers to a different event"


def mutate_partial(text: str) -> str:
    words=text.split()
    return " ".join(words[:max(2, len(words)//2)]) if len(words)>3 else text + " …"


def mutate_late_contradiction(text: str) -> str:
    return text.rstrip(" .!?;") + ", but the final conclusion was the opposite."


def mutate_distractor(text: str) -> str:
    return text.rstrip(" .!?;") + ". Additional unrelated background about another topic follows."


def wrap(text: str, i: int) -> str:
    ws=[
      lambda x:x,
      lambda x:"According to the available record, "+x,
      lambda x:"Based on the reported evidence, "+x,
      lambda x:"For the relevant event, "+x,
      lambda x:"The final documented finding was: "+x,
      lambda x:"After reviewing the evidence, "+x,
      lambda x:x+" as stated in the report.",
      lambda x:"In plain terms, "+x,
    ]
    return ws[i%len(ws)](text)


def add_pair(out, seen, q, gt, good, bad, kind, critical=False, source="shadow"):
    key=(q,gt,good,bad,kind)
    if bad==good or key in seen: return
    out.append({"question":q,"ground_truth":gt,"good":good,"bad":bad,"kind":kind,"critical":critical,"source":source})
    seen.add(key)


def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--out",type=Path,default=DEFAULT_OUT); ap.add_argument("--rounds",type=int,default=12)
    args=ap.parse_args(); seeds=json.loads(SEEDS.read_text(encoding="utf-8"))["cases"]
    official=json.loads(OFFICIAL.read_text(encoding="utf-8")) if OFFICIAL.exists() else {"cases":[]}
    base=list(seeds)
    for c in official.get("cases",[]):
        highs=[a for a in c.get("answers",[]) if a.get("tier")=="high"]
        lows=[a for a in c.get("answers",[]) if a.get("tier")=="low"]
        if not highs or not lows: continue
        for hi in highs:
            for lo in lows:
                base.append({"question":c["question"],"ground_truth":c["ground_truth"],"good":hi["text"],"bad":lo["text"],"kind":"official-pair","critical":False,"source":"official-benchmark"})

    out=[]; seen=set()
    for c in base:
        q,gt,good=c["question"],c["ground_truth"],c["good"]
        seed_pairs=[("number",mutate_number(good)),("polarity",mutate_direction(good)),("entity",mutate_entity(good)),
                    ("relation",mutate_relation(good)),("partial",mutate_partial(good)),("late-contradiction",mutate_late_contradiction(good)),
                    ("distractor",mutate_distractor(good))]
        for r in range(max(1,args.rounds)):
            sq=wrap(q,r); sgt=wrap(gt,r) if r%4==0 else gt; sg=wrap(good,r)
            for kind,bad in seed_pairs:
                add_pair(out,seen,sq,sgt,sg,wrap(bad,r),"generated-"+kind,bool(c.get("critical")),c.get("source","seed"))
    payload={"version":2,"generator":"generate_shadow_corpus.py","rounds":args.rounds,
             "seed_cases":len(seeds),"official_pair_cases":sum(1 for c in base if c.get("source")=="official-benchmark"),
             "cases":out}
    args.out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"output":str(args.out),"pairs":len(out),"seed_cases":len(seeds),"official_pairs":payload["official_pair_cases"]},indent=2))

if __name__=="__main__": main()
