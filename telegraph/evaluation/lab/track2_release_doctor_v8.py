#!/usr/bin/env python3
"""Canonical Track-2 doctor v8.

A RED semantic lab report is data, not an infrastructure exception. The
controller lets the existing v3/v6 lifecycle diagnose and repair the candidate
instead of stopping merely because presubmit_lab returned non-zero. The
production builder is the v3 material-conflict hardened release builder.
"""
from __future__ import annotations

import json
from pathlib import Path

import track2_release_doctor_v3 as d
import track2_release_doctor_v6 as v6

ROOT = Path(__file__).resolve().parents[3]
d.RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v3.py"
_orig_run_lab = d.run_lab


def run_lab_report(wasm: Path):
    try:
        return _orig_run_lab(wasm)
    except RuntimeError:
        # presubmit_lab_v2 deliberately exits non-zero for a RED candidate, but
        # it also writes the full report. Feed that report to the doctor's
        # diagnosis/repair loop instead of converting it into an opaque abort.
        if d.REPORT.exists():
            try:
                return json.loads(d.REPORT.read_text(encoding="utf-8"))
            except Exception:
                pass
        raise


def main() -> int:
    d.RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v3.py"
    d.run_lab = run_lab_report
    return v6.main()


if __name__ == "__main__":
    raise SystemExit(main())
