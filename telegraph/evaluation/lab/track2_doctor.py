#!/usr/bin/env python3
"""Self-healing Track 2 release doctor.

One command: build -> generate hard corpus -> lab -> diagnose -> apply only
pre-approved generalized source repairs -> rebuild -> repeat. It never edits
benchmark files, official checker code, thresholds, or the generated WASM.
Unknown failures stop closed with a machine-readable diagnosis.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
LAB = Path(__file__).resolve().parent
RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release.py"
GEN = LAB / "generate_shadow_corpus_v2.py"
PRESUBMIT = LAB / "presubmit_lab_v2.py"
DEFAULT_WASM = ROOT / "telegraph/evaluation/veridex-track2-doctor.wasm"
REPORT = ROOT / "telegraph/evaluation/presubmit-report.json"


def run(cmd: list[str], timeout: int = 1800) -> subprocess.CompletedProcess[str]:
    print("$", " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, timeout=timeout, check=False)


def read_report() -> dict:
    if not REPORT.exists():
        return {}
    return json.loads(REPORT.read_text(encoding="utf-8"))


def build(wasm: Path) -> None:
    p = run([sys.executable, str(RELEASE), "--out", str(wasm)], timeout=2400)
    if p.returncode != 0:
        print(p.stdout)
        print(p.stderr, file=sys.stderr)
        raise SystemExit("doctor: release build failed")


def generate(rounds: int) -> Path:
    corpus = LAB / "shadow_corpus.generated.json"
    p = run([sys.executable, str(GEN), "--rounds", str(rounds), "--out", str(corpus)], timeout=120)
    if p.returncode != 0:
        print(p.stderr, file=sys.stderr)
        raise SystemExit("doctor: corpus generation failed")
    return corpus


def diagnose(report: dict) -> list[str]:
    reasons: list[str] = []
    if report.get("historical_replay", {}).get("inversions", 0):
        reasons.append("historical-inversion")
    shadow = report.get("shadow", {})
    if shadow.get("inversions", 0):
        reasons.append("shadow-inversion")
    worst = report.get("worst_shadow_pairs", [])
    for row in worst:
        kind = str(row.get("kind", "")).lower()
        margin = float(row.get("goodScore", 0)) - float(row.get("badScore", 0))
        if margin <= 0:
            if "number" in kind or "numeric" in kind:
                reasons.append("numeric-inversion")
            elif any(x in kind for x in ("polarity", "direction", "contradiction")):
                reasons.append("polarity-inversion")
            elif "entity" in kind:
                reasons.append("entity-inversion")
            elif any(x in kind for x in ("incomplete", "qualifier", "distractor")):
                reasons.append("completeness-inversion")
            else:
                reasons.append("semantic-inversion")
    return sorted(set(reasons))


def apply_safe_repairs(reasons: list[str]) -> bool:
    text = RELEASE.read_text(encoding="utf-8")
    changed = False
    # Repair recipe R1: numeric equivalence must not bypass unit completeness.
    if any(r.startswith("numeric-") for r in reasons):
        required = [
            "fn vr_release_unit_completeness(",
            "let numeric_complete=vr_release_unit_completeness(",
            "let safe_numeric_equiv=numeric_equivalent&&numeric_complete;",
        ]
        if not all(x in text for x in required):
            raise SystemExit("doctor: numeric defect detected but approved repair anchors are missing; stopping closed")
        print("doctor: numeric defect detected; current release source already contains approved completeness guard")
        return False
    # Repair recipe R2: never silently accept a missing monotonic sharpening layer.
    if any(r in reasons for r in ("polarity-inversion", "semantic-inversion")):
        if "_MONOTONIC_SHARPEN" not in text or "t*t*(3.0-2.0*t)" not in text:
            raise SystemExit("doctor: semantic defect detected but no approved monotonic repair anchor exists; stopping closed")
    return changed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-iterations", type=int, default=3)
    ap.add_argument("--rounds", type=int, default=16)
    ap.add_argument("--wasm", type=Path, default=DEFAULT_WASM)
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()
    args.wasm.parent.mkdir(parents=True, exist_ok=True)

    history = []
    for iteration in range(1, max(1, args.max_iterations) + 1):
        print(f"\n=== DOCTOR ITERATION {iteration}/{args.max_iterations} ===")
        build(args.wasm)
        corpus = generate(args.rounds)
        p = run([sys.executable, str(PRESUBMIT), "--strict", "--json", "--corpus", str(corpus), "--out", str(REPORT), str(args.wasm)], timeout=2400)
        print(p.stdout)
        if p.returncode == 0:
            result = read_report(); result["doctor"] = {"iterations": iteration, "history": history}
            REPORT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
            print("DOCTOR VERDICT: GREEN")
            return 0
        report = read_report()
        reasons = diagnose(report)
        history.append({"iteration": iteration, "verdict": report.get("verdict"), "reasons": reasons})
        print("doctor diagnosis:", reasons or ["unknown"])
        if not reasons:
            print("DOCTOR VERDICT: RED (unknown failure; no autonomous patch applied)")
            return 2
        changed = apply_safe_repairs(reasons)
        if not changed:
            # Avoid an infinite repair loop. A known defect without an actionable
            # source delta must be handed back rather than rerunning unchanged.
            print("DOCTOR VERDICT: RED (known failure but no new approved repair delta)")
            return 2

    print("DOCTOR VERDICT: RED (iteration budget exhausted)")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
