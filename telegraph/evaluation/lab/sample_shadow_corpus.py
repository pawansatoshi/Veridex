#!/usr/bin/env python3
"""Deterministically sample a large shadow corpus for fast WASM pre-submit gates.

The full generated corpus remains available as evidence. This sampler only
controls the expensive neural WASM execution workload during iterative repair.
Critical cases, sources and mutation families are represented before filling
remaining slots in stable order.
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


def select(cases: list[dict], limit: int) -> list[dict]:
    if limit <= 0 or len(cases) <= limit:
        return list(cases)

    buckets: dict[tuple[str, str], list[dict]] = defaultdict(list)
    critical: list[dict] = []
    for case in cases:
        key = (str(case.get("source", "unknown")), str(case.get("kind", "unknown")))
        buckets[key].append(case)
        if case.get("critical"):
            critical.append(case)

    chosen: list[dict] = []
    seen: set[int] = set()

    def add(case: dict) -> None:
        marker = id(case)
        if marker not in seen and len(chosen) < limit:
            chosen.append(case)
            seen.add(marker)

    # Critical coverage first.
    for case in critical:
        add(case)
        if len(chosen) >= limit:
            return chosen

    # One representative from every source/mutation family.
    keys = sorted(buckets)
    cursor = 0
    while len(chosen) < limit and keys:
        key = keys[cursor % len(keys)]
        bucket = buckets[key]
        if bucket:
            add(bucket.pop(0))
        cursor += 1
        if cursor >= len(keys) and not any(buckets[k] for k in keys):
            break

    # Fill deterministically from the remaining corpus.
    for case in cases:
        add(case)
        if len(chosen) >= limit:
            break
    return chosen


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--limit", type=int, default=320)
    args = ap.parse_args()

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    cases = payload.get("cases", [])
    selected = select(cases, args.limit)
    out = dict(payload)
    out["sampled_from"] = len(cases)
    out["sample_limit"] = args.limit
    out["cases"] = selected
    out["output_pairs"] = len(selected)
    out["sampling"] = "deterministic-critical-source-kind-round-robin"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"input_pairs": len(cases), "output_pairs": len(selected), "limit": args.limit}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
