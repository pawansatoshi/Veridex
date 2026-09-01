#!/usr/bin/env python3
"""Track-2 release doctor v10.

Wraps v9's bounded candidate tournament with a safe deep-lab recovery loop.
The wrapper never monkey-patches its own deep runner recursively: the original
v9 lab function is passed explicitly to the self-healing loop.
"""
from __future__ import annotations

from pathlib import Path

import track2_release_doctor_v9 as v9


def deep_lab_self_heal(wasm: Path, corpus: Path, base_lab) -> dict:
    """Run deep lab and consume only approved semantic repair recipes."""
    max_repairs = 4
    attempts = []
    for attempt in range(1, max_repairs + 1):
        report = base_lab(wasm, corpus)
        verdict = report.get("verdict")
        row = {
            "attempt": attempt,
            "verdict": verdict,
            "quality": v9.quality(report),
            "shadow": report.get("shadow", {}),
            "critical": report.get("critical", {}),
            "historical_replay": report.get("historical_replay", {}),
        }
        attempts.append(row)
        v9.emit("doctor-v10-deep-attempt.json", row)
        if verdict == "GREEN":
            v9.emit("doctor-v10-deep-history.json", {"attempts": attempts, "verdict": "GREEN"})
            return report

        reasons = v9.diagnose(report)
        fixed, detail = v9.d.semantic_repair(reasons)
        v9.emit(
            f"doctor-v10-deep-repair-{attempt}.json",
            {"reasons": reasons, "repaired": fixed, "detail": detail},
        )
        if not fixed:
            break

        v9.build_candidate(wasm)
        v9.d.structural(wasm)

    v9.emit("doctor-v10-deep-history.json", {"attempts": attempts, "verdict": "RED"})
    raise RuntimeError("doctor-v10: deep lab remained non-GREEN after bounded self-healing")


def main() -> int:
    original_lab = v9.lab_once

    def patched_lab_once(wasm: Path, corpus: Path) -> dict:
        if corpus == v9.DEEP_CORPUS:
            return deep_lab_self_heal(wasm, corpus, original_lab)
        return original_lab(wasm, corpus)

    v9.lab_once = patched_lab_once
    try:
        return v9.main()
    finally:
        v9.lab_once = original_lab


if __name__ == "__main__":
    raise SystemExit(main())
