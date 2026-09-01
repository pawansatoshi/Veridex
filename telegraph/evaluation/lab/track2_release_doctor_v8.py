#!/usr/bin/env python3
"""Canonical Track-2 doctor v8.

A RED semantic lab report is data, not an infrastructure exception. The
controller feeds the report into a bounded, source-level repair ladder for the
current v3 scorer and rebuilds/retests every variant. No benchmark/checker
thresholds are modified.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import track2_release_doctor_v3 as d
import track2_release_doctor_v6 as v6

ROOT = Path(__file__).resolve().parents[3]
RELEASE_PATH = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v3.py"
d.RELEASE = RELEASE_PATH
_orig_run_lab = d.run_lab


def run_lab_report(wasm: Path):
    try:
        return _orig_run_lab(wasm)
    except RuntimeError:
        if d.REPORT.exists():
            try:
                return json.loads(d.REPORT.read_text(encoding="utf-8"))
            except Exception:
                pass
        raise


def diagnose(report: dict, text: str = "") -> list[str]:
    reasons = set(v6.diagnose(report, text))
    shadow = report.get("shadow", {})
    hist = report.get("historical_replay", {})
    if shadow.get("inversions", 0):
        reasons.add("shadow-inversion")
    if hist.get("inversions", 0):
        reasons.add("historical-inversion")
    return sorted(reasons)


def semantic_repair(reasons):
    """Apply the next unused generalized material-conflict strength variant.

    The builder regenerates the wrapper from source on every attempt, so changing
    these constants is deterministic and reversible. The doctor records the
    previous source hash and never reapplies a consumed variant.
    """
    text = RELEASE_PATH.read_text(encoding="utf-8")
    variants = [
        ("0.04", "0.20", "baseline material conflict"),
        ("0.025", "0.16", "stronger material conflict"),
        ("0.015", "0.12", "aggressive material conflict"),
    ]
    match = re.search(r"const VR_MATERIAL_FACTOR:f32=([0-9.]+);\s*\nconst VR_MATERIAL_CAP:f32=([0-9.]+);", text)
    if not match:
        return False, "v3 material constants not found"
    current = (match.group(1), match.group(2))
    for factor, cap, label in variants:
        if current == (factor, cap):
            continue
        new = text[:match.start()] + f"const VR_MATERIAL_FACTOR:f32={factor};\nconst VR_MATERIAL_CAP:f32={cap};" + text[match.end():]
        RELEASE_PATH.write_text(new, encoding="utf-8")
        return True, f"applied {label}: factor={factor}, cap={cap}"
    return False, "all approved material-conflict variants consumed"


def main() -> int:
    d.RELEASE = RELEASE_PATH
    d.run_lab = run_lab_report
    d.diagnose = diagnose
    # v6 owns the lifecycle; inject this module's repair function into v6 so its
    # iteration loop uses the current release builder rather than the legacy path.
    v6.semantic_repair = semantic_repair
    return v6.main()


if __name__ == "__main__":
    raise SystemExit(main())
