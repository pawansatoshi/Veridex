#!/usr/bin/env python3
"""Track-2 release builder v5: broaden factual numeric/date context conservatively."""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release_v4 as v4


def patch() -> None:
    v4.patch()
    old = '''fn vr_numeric_context(q:&[u8])->bool{const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity"];vr_has_any(q,TERMS)}'''
    new = '''fn vr_numeric_context(q:&[u8])->bool{const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity",b"count",b"victims",b"users",b"accounts",b"incidents",b"transactions",b"cases",b"people",b"items",b"date",b"year",b"month",b"day",b"time",b"when"];vr_has_any(q,TERMS)}'''
    if old not in build_candidate.WRAPPER:
        raise RuntimeError("v5 patch: numeric-context marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(old, new, 1)


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
