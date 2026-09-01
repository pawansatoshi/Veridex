#!/usr/bin/env python3
"""Bounded Track-2 pre-submit doctor.

The doctor owns the lab lifecycle: validate tooling, build when requested,
generate the corpus, run staged candidate tests, diagnose failures, and apply
only approved lab-infrastructure repairs. It never edits benchmark cases,
checker thresholds, or invents semantic fixes.
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
CORPUS = LAB / "shadow_corpus.generated.json"


def run(cmd: list[str], timeout: int = 1800) -> subprocess.CompletedProcess[str]:
    print("$", " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, timeout=timeout, check=False)


def py_compile(path: Path) -> tuple[bool, str]:
    p = run([sys.executable, "-m", "py_compile", str(path)], timeout=30)
    return p.returncode == 0, (p.stderr or p.stdout).strip()


def repair_generator_syntax() -> tuple[bool, str]:
    """Repair only the known mutation-list extra-close-paren defect."""
    text = GEN.read_text(encoding="utf-8")
    patterns = [
        (r"\(\"double-number-contradiction\",\s*late_contradiction\(mutate_number\(case\[\"good\"\]\)\)\)\)\]",
         '("double-number-contradiction", late_contradiction(mutate_number(case["good"]))) ]'),
        (r"\('double-number-contradiction',\s*late_contradiction\(mutate_number\(case\['good'\]\)\)\)\)\]",
         "('double-number-contradiction', late_contradiction(mutate_number(case['good']))) ]"),
    ]
    for pattern, replacement in patterns:
        repaired, count = re.subn(pattern, replacement, text, count=1)
        if count:
            GEN.write_text(repaired, encoding="utf-8")
            ok, err = py_compile(GEN)
            if ok:
                return True, "repaired known shadow-generator delimiter defect"
            GEN.write_text(text, encoding="utf-8")
            return False, f"repair failed syntax validation: {err}"
    return False, "no approved generator repair pattern matched"


def run_generator(rounds: int) -> tuple[bool, str]:
    p = run([sys.executable, str(GEN), "--rounds", str(rounds), "--out", str(CORPUS)], timeout=180)
    if p.returncode == 0:
        return True, p.stdout.strip()
    return False, p.stderr.strip() or p.stdout.strip()


def run_lab(wasm: Path) -> tuple[int, str]:
    p = run([
        sys.executable, str(PRESUBMIT), "--strict", "--json",
        "--corpus", str(CORPUS), "--out", str(REPORT), str(wasm)
    ], timeout=2400)
    return p.returncode, p.stdout.strip() or p.stderr.strip()


def classify(report: dict) -> list[str]:
    reasons: list[str] = []
    if report.get("historical_replay", {}).get("inversions", 0):
        reasons.append("historical-inversion")
    shadow = report.get("shadow", {})
    if shadow.get("inversions", 0):
        reasons.append("shadow-inversion")
    if report.get("critical", {}).get("inversions", 0):
        reasons.append("critical-inversion")
    invariant = report.get("invariance", {})
    if invariant.get("severe_changes_gt_0_10", 0):
        reasons.append("invariance-regression")
    if shadow.get("mean_margin", 0) < .20:
        reasons.append("margin-warning")
    return sorted(set(reasons))


def main() -> int:
    ap = argparse.ArgumentParser(description="Track-2 pre-submit doctor")
    ap.add_argument("--wasm", type=Path, default=DEFAULT_WASM)
    ap.add_argument("--existing-wasm", action="store_true")
    ap.add_argument("--max-iterations", type=int, default=2)
    ap.add_argument("--rounds", type=int, default=2)
    ap.add_argument("--deep-rounds", type=int, default=8)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    if not (1 <= args.max_iterations <= 3):
        raise SystemExit("--max-iterations must be 1..3")
    if not (1 <= args.rounds <= args.deep_rounds <= 16):
        raise SystemExit("require 1 <= rounds <= deep-rounds <= 16")

    args.wasm.parent.mkdir(parents=True, exist_ok=True)
    history: list[dict] = []

    for tool in (GEN, PRESUBMIT):
        ok, err = py_compile(tool)
        if not ok:
            repaired, detail = repair_generator_syntax() if tool == GEN else (False, "no approved presubmit repair")
            event = {"stage": "tooling", "file": str(tool), "error": err, "repair": detail, "repaired": repaired}
            history.append(event)
            if not repaired:
                result = {"verdict": "RED", "diagnosis": {"class": "lab-infrastructure", "reason": err}, "history": history}
                print(json.dumps(result, indent=2) if args.json else f"RED lab-infrastructure: {err}")
                return 1
            ok, err = py_compile(tool)
            if not ok:
                result = {"verdict": "RED", "diagnosis": {"class": "lab-infrastructure", "reason": err}, "history": history}
                print(json.dumps(result, indent=2) if args.json else f"RED lab-infrastructure: {err}")
                return 1

    if not args.existing_wasm:
        p = run([sys.executable, str(RELEASE), "--out", str(args.wasm)], timeout=2400)
        if p.returncode != 0:
            result = {"verdict": "RED", "diagnosis": {"class": "build", "reason": p.stderr.strip() or p.stdout.strip()}, "history": history}
            print(json.dumps(result, indent=2) if args.json else "RED build: release builder failed")
            return 1
    elif not args.wasm.exists():
        raise SystemExit(f"candidate WASM not found: {args.wasm}")

    for iteration in range(1, args.max_iterations + 1):
        rounds = args.rounds if iteration == 1 else args.deep_rounds
        generated, detail = run_generator(rounds)
        if not generated:
            repaired, repair_detail = repair_generator_syntax()
            history.append({"iteration": iteration, "stage": "generation", "error": detail, "repair": repair_detail, "repaired": repaired})
            if not repaired:
                result = {"verdict": "RED", "diagnosis": {"class": "lab-generation", "reason": detail}, "history": history}
                print(json.dumps(result, indent=2) if args.json else f"RED lab-generation: {detail}")
                return 1
            generated, detail = run_generator(rounds)
            if not generated:
                result = {"verdict": "RED", "diagnosis": {"class": "lab-generation", "reason": detail}, "history": history}
                print(json.dumps(result, indent=2) if args.json else f"RED lab-generation: {detail}")
                return 1

        code, output = run_lab(args.wasm)
        report = json.loads(REPORT.read_text(encoding="utf-8")) if REPORT.exists() else {}
        reasons = classify(report)
        history.append({"iteration": iteration, "rounds": rounds, "lab_returncode": code, "diagnosis": reasons})

        if code == 0 and report.get("verdict") == "GREEN":
            report["doctor"] = {"mode": "bounded-self-healing", "history": history}
            REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
            print(json.dumps(report, indent=2) if args.json else f"GREEN doctor pairs={report['shadow']['pairs']} mean={report['shadow']['mean_margin']:.6f} p10={report['shadow']['p10_margin']:.6f}")
            return 0

        if reasons:
            break

    final = {"verdict": "RED", "diagnosis": {"class": "candidate", "reason": history[-1].get("diagnosis", ["unknown"])}, "history": history}
    print(json.dumps(final, indent=2) if args.json else f"RED doctor: {final['diagnosis']['reason']}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
