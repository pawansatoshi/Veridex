#!/usr/bin/env python3
"""Generate a deterministic independent-style Track 2 stress corpus.

The generator creates explicit GOOD/BAD pairs from three separately labelled
sources and a separate invariance corpus. It does not modify official cases or
recursively mutate generated cases.
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
INDEPENDENT = HERE / "independent_seed_corpus_v2.json"
DEFAULT_OUT = HERE / "shadow_corpus.generated.json"


def mutate_number(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        raw = match.group(0).replace(",", "")
        value = float(raw)
        delta = max(1.0, abs(value) * 0.1) if abs(value) >= 1000 else 1.0
        updated = value + delta
        return str(int(updated)) if updated.is_integer() else f"{updated:g}"
    out = re.sub(r"\b\d+(?:[.,]\d+)?\b", repl, text, count=1)
    return out if out != text else f"{text} 1"


def mutate_direction(text: str) -> str:
    pairs = [
        ("approved", "rejected"), ("authorized", "unauthorized"),
        ("allowed", "blocked"), ("confirmed", "denied"),
        ("safe", "unsafe"), ("legitimate", "fraudulent"),
        ("genuine", "counterfeit"), ("increased", "decreased"),
        ("increase", "decrease"), ("rose", "fell"),
        ("rising", "falling"), ("positive", "negative"),
        ("bullish", "bearish"), ("compromised", "secure"),
        ("trusted", "malicious"), ("yes", "no"),
        ("true", "false"), ("prevented", "caused"),
        ("succeeded", "failed"), ("success", "failure"),
    ]
    for good, bad in pairs:
        match = re.search(rf"\b{re.escape(good)}\b", text, re.IGNORECASE)
        if match:
            return text[:match.start()] + bad + text[match.end():]
    return "not " + text


def mutate_entity(text: str) -> str:
    pairs = [
        ("Apple", "Microsoft"), ("Ethereum", "Solana"),
        ("Coinbase", "Binance"), ("Kraken", "Coinbase"),
        ("OpenAI", "Google"), ("Acme", "Beta"),
        ("Delta", "Gamma"), ("Arbitrum", "Optimism"),
        ("Visa", "Mastercard"), ("AWS", "Azure"),
        ("Northstar", "Southstar"), ("Protocol X", "Protocol Y"),
    ]
    for good, bad in pairs:
        match = re.search(rf"\b{re.escape(good)}\b", text, re.IGNORECASE)
        if match:
            return text[:match.start()] + bad + text[match.end():]
    return text + " involving another entity"


def mutate_relation(text: str) -> str:
    pairs = [
        ("issued", "received"), ("received", "issued"),
        ("processed", "received"), ("blocked", "allowed"),
        ("reported", "denied"), ("prevented", "caused"),
        ("caused", "prevented"), ("approved", "requested"),
        ("requested", "approved"), ("owns", "uses"),
        ("controls", "owns"), ("sent", "received"),
    ]
    for good, bad in pairs:
        match = re.search(rf"\b{re.escape(good)}\b", text, re.IGNORECASE)
        if match:
            return text[:match.start()] + bad + text[match.end():]
    return text + " for a different relationship"


def incomplete(text: str) -> str:
    words = text.split()
    if len(words) > 3:
        return " ".join(words[: max(2, len(words) // 2)])
    return text + " ..."


def late_contradiction(text: str) -> str:
    return text.rstrip(" .!?;") + ", but the final conclusion was the opposite."


def distract(text: str) -> str:
    return text.rstrip(" .!?;") + ". Additional unrelated background follows."


def hedged(text: str) -> str:
    return "It may be that " + text


def wrong_qualifier(text: str) -> str:
    return text.rstrip(" .!?;") + ", but only for a different entity and time period."


def long_prefix(text: str, count: int) -> str:
    fillers = [
        "The surrounding context contains historical details.",
        "Several related observations were discussed during review.",
        "Those observations are background only.",
        "The report also discusses adjacent events.",
    ]
    prefix = " ".join(fillers[i % len(fillers)] for i in range(count))
    return f"{prefix} {text}"


def wrap(text: str, index: int) -> str:
    wrappers = [
        lambda value: value,
        lambda value: "According to the available record, " + value,
        lambda value: "Based on the reported evidence, " + value,
        lambda value: "For the relevant event, " + value,
        lambda value: "The final documented finding was: " + value,
        lambda value: "After reviewing the evidence, " + value,
        lambda value: "In plain terms, " + value,
        lambda value: value + " as reported.",
        lambda value: long_prefix(value, 2),
        lambda value: long_prefix(value, 5),
    ]
    return wrappers[index % len(wrappers)](text)


def normalize_case(case: dict, source: str) -> list[dict]:
    if "good" in case and "bad" in case:
        return [{
            "question": case["question"], "ground_truth": case["ground_truth"],
            "good": case["good"], "bad": case["bad"],
            "critical": bool(case.get("critical")), "source": source,
        }]
    highs = [answer for answer in case.get("answers", []) if answer.get("tier") == "high"]
    lows = [answer for answer in case.get("answers", []) if answer.get("tier") == "low"]
    return [{
        "question": case["question"], "ground_truth": case["ground_truth"],
        "good": high["text"], "bad": low["text"],
        "critical": bool(case.get("critical")), "source": source,
    } for high in highs for low in lows]


def add_pair(out, seen, case, bad, kind, round_id):
    question = wrap(case["question"], round_id)
    ground_truth = wrap(case["ground_truth"], round_id) if round_id % 4 == 0 else case["ground_truth"]
    good = wrap(case["good"], round_id)
    mutated_bad = wrap(bad, round_id)
    key = (question, good, mutated_bad, kind)
    if mutated_bad == good or key in seen:
        return
    out.append({"question":question,"ground_truth":ground_truth,"good":good,"bad":mutated_bad,
                "kind":kind,"critical":bool(case.get("critical")),"source":case["source"],"round":round_id})
    seen.add(key)


def add_invariance(out, seen, case, variant_kind, variant):
    question = case["question"]
    ground_truth = case["ground_truth"]
    reference = case["good"]
    if variant == reference:
        return
    key = (question, reference, variant, variant_kind)
    if key in seen:
        return
    out.append({"question":question,"ground_truth":ground_truth,"reference":reference,"variant":variant,"kind":variant_kind,"source":case["source"]})
    seen.add(key)


def load_cases(path: Path, source: str) -> list[dict]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    output=[]
    for case in payload.get("cases", []):
        output.extend(normalize_case(case, source))
    return output


def main() -> int:
    parser=argparse.ArgumentParser();parser.add_argument("--rounds",type=int,default=16);parser.add_argument("--out",type=Path,default=DEFAULT_OUT);args=parser.parse_args()
    if not 1<=args.rounds<=64: raise SystemExit("rounds must be between 1 and 64")

    base=[];base.extend(load_cases(SEEDS,"seed"));base.extend(load_cases(INDEPENDENT,"independent-v2"));base.extend(load_cases(OFFICIAL,"official-benchmark"))
    output=[];seen=set();invariance=[];invariant_seen=set()
    for case in base:
        mutations=[
            ("number",mutate_number(case["good"])),("direction",mutate_direction(case["good"])),
            ("entity",mutate_entity(case["good"])),("relation",mutate_relation(case["good"])),
            ("incomplete",incomplete(case["good"])),("late-contradiction",late_contradiction(case["good"])),
            ("distractor",distract(case["good"])),("hedged",hedged(case["good"])),
            ("wrong-qualifier",wrong_qualifier(case["good"])),
            ("double-number-contradiction",late_contradiction(mutate_number(case["good"]))),
        ]
        for round_id in range(args.rounds):
            for kind,bad in mutations: add_pair(output,seen,case,bad,f"generated-{kind}",round_id)
        for kind,variant in [
            ("case-fold",case["good"].lower()),
            ("punctuation-normalized",case["good"].replace(".","").replace(",","")),
            ("context-prefix", "According to the available record, " + case["good"]),
            ("context-suffix", case["good"] + " as reported."),
        ]:
            add_invariance(invariance,invariant_seen,case,f"invariant-{kind}",variant)

    source_counts={src:sum(case["source"]==src for case in base) for src in ["seed","independent-v2","official-benchmark"]}
    payload={"version":5,"generator":"generate_shadow_corpus_v2.py","rounds":args.rounds,"base_cases":len(base),"output_pairs":len(output),"source_counts":source_counts,"cases":output,"invariance":invariance}
    args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"output_pairs":len(output),"base_cases":len(base),"invariance_variants":len(invariance),"source_counts":source_counts},indent=2));return 0

if __name__=="__main__": raise SystemExit(main())
