#!/usr/bin/env python3
"""Canonical Track-2 release doctor v6.

Uses the anchor-robust release builder and keeps the v5 fast/deep lifecycle.
Repairs remain allow-listed and fail-closed; evaluator thresholds/cases are
never modified.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import track2_release_doctor_v5 as v5
import track2_release_doctor_v4 as v4
import track2_release_doctor_v3 as d

ROOT = Path(__file__).resolve().parents[3]
# Critical fix: v3's build() must use the robust function-boundary builder,
# not the brittle exact-anchor release wrapper.
d.RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v2.py"

ORIGINAL_DIAGNOSE = d.diagnose
BASE_SEMANTIC_REPAIR = v4.semantic_repair

NUM_RE = re.compile(r"(?:\$|€|£|₹|usd|eur|gbp|inr|jpy|percent|percentage|%|\b\d[\d,]*(?:\.\d+)?(?:[kmb])?\b)", re.I)
POLARITY_RE = re.compile(r"\b(?:yes|no|true|false|approved|rejected|authorized|unauthorized|allowed|blocked|safe|unsafe|secure|compromised|fraudulent|genuine|fake|increase|decrease|increased|decreased|rose|fell|prevented|caused)\b", re.I)
ENTITY_RE = re.compile(r"\b[A-Z][A-Za-z0-9_-]{2,}\b")


def _signals_from_pairs(report: dict) -> list[str]:
    reasons: list[str] = []
    pairs = list(report.get("worst_pairs", []))
    for row in pairs[:30]:
        blob = " ".join(str(row.get(k, "")) for k in ("kind", "question", "ground_truth", "good", "bad")).lower()
        kind = str(row.get("kind", "")).lower()
        if "number" in kind or "numeric" in kind or NUM_RE.search(blob):
            reasons.append("numeric")
        if any(x in kind for x in ("direction", "polarity", "contradiction")) or POLARITY_RE.search(blob):
            reasons.append("polarity")
        if any(x in kind for x in ("incomplete", "fragment", "qualifier")):
            reasons.append("completeness")
        good = str(row.get("good", "")); bad = str(row.get("bad", ""))
        if len(bad.split()) + 2 < len(good.split()):
            reasons.append("completeness")
        if "entity" in kind or (ENTITY_RE.findall(good) and ENTITY_RE.findall(bad)):
            reasons.append("entity")
    return sorted(set(reasons))


def diagnose(report: dict, text: str = "") -> list[str]:
    out = set(ORIGINAL_DIAGNOSE(report, text))
    out.update(_signals_from_pairs(report))
    blob = (json.dumps(report, ensure_ascii=False) + " " + text).lower()
    if any(x in blob for x in ("currency", "percentage", "numeric", "number")):
        out.add("numeric")
    if any(x in blob for x in ("direction", "polarity", "negation", "opposite")):
        out.add("polarity")
    return sorted(out)


def semantic_repair(reasons):
    ordered = [x for x in ("numeric", "completeness", "polarity") if x in reasons]
    if ordered:
        ok, detail = BASE_SEMANTIC_REPAIR(ordered[:1])
        if ok:
            return True, detail
    return BASE_SEMANTIC_REPAIR(reasons)


def main() -> int:
    # Small stratified repair loop; v5 performs the mandatory deep corpus pass
    # before handing the candidate to authoritative Telegraph gates.
    v5.FAST_LIMIT = 64
    d.diagnose = diagnose
    d.semantic_repair = semantic_repair
    return v5.main()


if __name__ == "__main__":
    raise SystemExit(main())
