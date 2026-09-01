#!/usr/bin/env python3
"""Compare two WASM candidates using the same pre-submit laboratory.

The comparison is intentionally distribution-level: it tells whether the new
candidate improves the independent lab risk metrics without claiming anything
about Telegraph's hidden Stage-2 benchmark.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
LAB = HERE / "presubmit_lab.py"


def run_lab(wasm: Path, out: Path) -> dict:
    p = subprocess.run([sys.executable, str(LAB), "--json", "--rounds", "12", "--out", str(out), str(wasm)],
                       text=True, capture_output=True, check=False, timeout=2400)
    if not out.exists():
        raise RuntimeError(p.stderr.strip() or p.stdout.strip() or "lab did not write a report")
    return json.loads(out.read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("baseline", type=Path)
    ap.add_argument("candidate", type=Path)
    args = ap.parse_args()
    if not args.baseline.exists() or not args.candidate.exists():
        print("both WASM paths must exist", file=sys.stderr)
        return 2
    with tempfile.TemporaryDirectory(prefix="veridex-lab-compare-") as td:
        a = run_lab(args.baseline, Path(td) / "baseline.json")
        b = run_lab(args.candidate, Path(td) / "candidate.json")
    metrics = ["inversions", "mean_margin", "p10_margin", "worst_margin", "near_ties_lt_0_02", "near_ties_lt_0_05"]
    delta = {}
    for m in metrics:
        av = a["shadow"].get(m, 0); bv = b["shadow"].get(m, 0)
        delta[m] = {"baseline": av, "candidate": bv, "delta": bv - av}
    result = {
        "baseline_sha256": a["artifact"]["sha256"],
        "candidate_sha256": b["artifact"]["sha256"],
        "baseline_verdict": a["verdict"],
        "candidate_verdict": b["verdict"],
        "shadow_delta": delta,
        "candidate_improves_mean_margin": b["shadow"]["mean_margin"] > a["shadow"]["mean_margin"],
        "candidate_reduces_inversions": b["shadow"]["inversions"] <= a["shadow"]["inversions"],
        "candidate_reduces_near_ties": b["shadow"]["near_ties_lt_0_02"] <= a["shadow"]["near_ties_lt_0_02"],
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
