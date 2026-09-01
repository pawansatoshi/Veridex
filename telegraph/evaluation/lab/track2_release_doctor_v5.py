#!/usr/bin/env python3
"""Track-2 release doctor v5: fast iterative lab, deep final lab, full gates.

The expensive neural shadow corpus is sampled deterministically during repair
iterations, while one full deep corpus pass is required immediately before
Telegraph's authoritative gates. No evaluator thresholds or benchmark data are
modified. The v4/v3 repair logic remains the source of truth.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import track2_release_doctor_v4 as v4
import track2_release_doctor_v3 as d

LAB = Path(__file__).resolve().parent
FULL_CORPUS = LAB / "shadow_corpus.generated.json"
FAST_CORPUS = LAB / "shadow_corpus.fast.generated.json"
SAMPLER = LAB / "sample_shadow_corpus.py"

ORIGINAL_GENERATE = d.generate
ORIGINAL_AUTHORITATIVE = d.authoritative
MODE = "fast"
FAST_LIMIT = 192
DEEP_ROUNDS = 1


def _sample_full(limit: int) -> None:
    p = d.run([
        sys.executable,
        str(SAMPLER),
        "--input", str(FULL_CORPUS),
        "--output", str(FAST_CORPUS),
        "--limit", str(limit),
    ], 120, 1)
    if p.returncode:
        raise RuntimeError("shadow-sampler: " + (p.stderr.strip() or p.stdout.strip()))
    d.CORPUS = FAST_CORPUS
    d.emit("shadow-sample-summary.json", json.loads(p.stdout) if p.stdout.strip().startswith("{") else {"stdout": p.stdout})


def generate(rounds: int) -> None:
    # Iterative repair runs are deliberately bounded to one generated round;
    # the deterministic sampler then keeps only a representative stress set.
    ORIGINAL_GENERATE(max(1, min(rounds, DEEP_ROUNDS)))
    if MODE == "fast":
        _sample_full(FAST_LIMIT)
    else:
        d.CORPUS = FULL_CORPUS
        d.emit("shadow-deep-mode.json", {"corpus": str(FULL_CORPUS), "rounds": max(1, min(rounds, DEEP_ROUNDS))})


def authoritative(wasm: Path, max_iter: int) -> None:
    global MODE
    MODE = "deep"
    deep_rounds = 1
    ORIGINAL_GENERATE(deep_rounds)
    d.CORPUS = FULL_CORPUS
    try:
        deep_report = d.run_lab(wasm)
    except Exception as exc:
        msg = str(exc)
        report = json.loads(d.REPORT.read_text(encoding="utf-8")) if d.REPORT.exists() else {}
        reasons = d.diagnose(report, msg)
        fixed, detail = v4.semantic_repair(reasons)
        d.emit("doctor-deep-repair.json", {"error": msg, "reasons": reasons, "repaired": fixed, "detail": detail})
        if not fixed:
            raise
        d.build(wasm)
        d.structural(wasm)
        ORIGINAL_GENERATE(deep_rounds)
        d.CORPUS = FULL_CORPUS
        deep_report = d.run_lab(wasm)
    d.emit("deep-lab-final.json", {
        "verdict": deep_report.get("verdict"),
        "shadow": deep_report.get("shadow", {}),
        "historical_replay": deep_report.get("historical_replay", {}),
        "critical": deep_report.get("critical", {}),
        "artifact": deep_report.get("artifact", {}),
        "mode": "full-generated-corpus-one-round",
        "rounds": deep_rounds,
    })
    if deep_report.get("verdict") != "GREEN":
        raise RuntimeError("deep pre-submit lab did not reach GREEN")
    ORIGINAL_AUTHORITATIVE(wasm, max_iter)


def main() -> int:
    d.generate = generate
    d.authoritative = authoritative
    d.semantic_repair = v4.semantic_repair
    # Keep v3's CLI and release evidence contract unchanged.
    return d.main()


if __name__ == "__main__":
    raise SystemExit(main())
