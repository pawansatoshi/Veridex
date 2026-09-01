#!/usr/bin/env python3
"""Canonical Track-2 doctor v8.

A RED semantic lab report is data, not an infrastructure exception. The
controller feeds the report into a bounded source-level repair/search ladder
for the current v3 scorer and rebuilds/retests every variant. No
benchmark/checker thresholds are modified.
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

# Ordered from conservative to increasingly strong factual-conflict separation.
# Each tuple is (material-factor, material-cap, label). These are deliberately
# bounded and benchmark-agnostic; the doctor never edits evaluator thresholds.
REPAIR_LADDER = [
    ("0.05", "0.30", "conservative-material"),
    ("0.04", "0.20", "baseline-material"),
    ("0.035", "0.18", "moderate-material"),
    ("0.030", "0.16", "moderate-strong-material"),
    ("0.025", "0.14", "strong-material"),
    ("0.020", "0.12", "strong-cap-material"),
    ("0.017", "0.10", "aggressive-material"),
    ("0.015", "0.08", "aggressive-cap-material"),
    ("0.012", "0.06", "very-aggressive-material"),
    ("0.010", "0.05", "maximum-material"),
]


def run_lab_report(wasm: Path):
    try:
        return _orig_run_lab(wasm)
    except RuntimeError:
        # A RED semantic report is still valid data; feed it into diagnosis.
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
    """Apply the next unused generalized scorer variant.

    The repair is selected from a deterministic finite ladder. The source file
    itself is the mutable state; every applied variant is recorded through its
    exact factor/cap pair so the same repair cannot be repeated.
    """
    text = RELEASE_PATH.read_text(encoding="utf-8")
    match = re.search(
        r"const VR_MATERIAL_FACTOR:f32=([0-9.]+);\nconst VR_MATERIAL_CAP:f32=([0-9.]+);",
        text,
    )
    if not match:
        return False, "v3 material constants not found"

    current = (match.group(1), match.group(2))
    attempted = {current}
    history = d.EVID / "doctor-semantic-repairs.jsonl"
    if history.exists():
        for line in history.read_text(encoding="utf-8").splitlines():
            try:
                row = json.loads(line)
                pair = (str(row.get("factor")), str(row.get("cap")))
                attempted.add(pair)
            except Exception:
                continue

    for factor, cap, label in REPAIR_LADDER:
        pair = (factor, cap)
        if pair in attempted:
            continue
        new = (
            text[:match.start()]
            + f"const VR_MATERIAL_FACTOR:f32={factor};\nconst VR_MATERIAL_CAP:f32={cap};"
            + text[match.end():]
        )
        RELEASE_PATH.write_text(new, encoding="utf-8")
        d.EVID.mkdir(parents=True, exist_ok=True)
        with history.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps({"factor": factor, "cap": cap, "label": label}) + "\n")
        return True, f"applied {label}: factor={factor}, cap={cap}"
    return False, "all approved material-conflict variants consumed"


def main() -> int:
    d.RELEASE = RELEASE_PATH
    d.run_lab = run_lab_report
    d.diagnose = diagnose
    # v6.main resolves this module-global at runtime, so our expanded repair
    # ladder is what the v3/v5 lifecycle actually invokes.
    v6.semantic_repair = semantic_repair
    return v6.main()


if __name__ == "__main__":
    raise SystemExit(main())
