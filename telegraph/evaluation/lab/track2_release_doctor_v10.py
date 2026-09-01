#!/usr/bin/env python3
"""Track-2 release doctor v10.

Wraps v9's bounded candidate tournament with a safe deep-lab recovery loop.
The wrapper owns its diagnostic contract and never relies on undeclared v9
helpers. The original v9 lab function is passed explicitly, preventing
recursive monkey-patching.
"""
from __future__ import annotations

import json
from pathlib import Path

import track2_release_doctor_v9 as v9


def diagnose(report: dict, text: str = "") -> list[str]:
    """Classify deep-lab failures into generalized repair families."""
    blob = (json.dumps(report, ensure_ascii=False) + " " + (text or "")).lower()
    out: list[str] = []
    shadow = report.get("shadow", {}) if isinstance(report, dict) else {}
    hist = report.get("historical_replay", {}) if isinstance(report, dict) else {}
    critical = report.get("critical", {}) if isinstance(report, dict) else {}

    if int(shadow.get("inversions", 0) or 0) > 0:
        out.append("shadow-inversion")
    if int(critical.get("inversions", 0) or 0) > 0:
        out.append("critical-inversion")
    if int(hist.get("inversions", 0) or 0) > 0:
        out.append("historical-inversion")
    if float(shadow.get("mean_margin", 1.0) or 0.0) < 0.20:
        out.append("weak-margin")
    if any(x in blob for x in ("numeric", "currency", "percentage", "number")):
        out.append("numeric")
    if any(x in blob for x in ("direction", "polarity", "negation", "opposite")):
        out.append("polarity")
    if any(x in blob for x in ("incomplete", "fragment", "qualifier", "distractor", "undercomplete")):
        out.append("completeness")
    if any(x in blob for x in ("entity", "relationship", "different period", "different time")):
        out.append("material-conflict")
    return sorted(set(out))


def _require_api() -> None:
    """Fail fast before any expensive WASM execution if dependencies drift."""
    required = {
        "lab_once": getattr(v9, "lab_once", None),
        "quality": getattr(v9, "quality", None),
        "build_candidate": getattr(v9, "build_candidate", None),
        "emit": getattr(v9, "emit", None),
        "structural": getattr(v9.d, "structural", None),
        "semantic_repair": getattr(v9.d, "semantic_repair", None),
    }
    missing = [name for name, value in required.items() if not callable(value)]
    if missing:
        raise RuntimeError("doctor-v10 API contract missing: " + ", ".join(missing))


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

        reasons = diagnose(report)
        fixed, detail = v9.d.semantic_repair(reasons)
        v9.emit(
            f"doctor-v10-deep-repair-{attempt}.json",
            {"reasons": reasons, "repaired": fixed, "detail": detail},
        )
        if not fixed:
            break

        # Every repair is rebuilt and structurally validated before the next
        # deep execution. No benchmark/checker thresholds or corpus data are
        # modified by this path.
        v9.build_candidate(wasm)
        v9.d.structural(wasm)

    v9.emit("doctor-v10-deep-history.json", {"attempts": attempts, "verdict": "RED"})
    raise RuntimeError("doctor-v10: deep lab remained non-GREEN after bounded self-healing")


def main() -> int:
    _require_api()
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
