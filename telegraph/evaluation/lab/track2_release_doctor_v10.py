#!/usr/bin/env python3
"""Track-2 release doctor v10.

Owns the deep self-healing layer around v9. It fails fast on API drift, tests
an independently hardened release candidate early, then tries approved
semantic repairs. A candidate is accepted only after the same deep corpus is
GREEN. No benchmark/checker thresholds or corpus data are modified.
"""
from __future__ import annotations

import json
import py_compile
from pathlib import Path

import track2_release_doctor_v9 as v9

ROOT = Path(__file__).resolve().parents[3]
LAB_RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_lab.py"


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
    """Fail before expensive WASM execution if doctor dependencies drift."""
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
    if not LAB_RELEASE.is_file():
        raise RuntimeError("doctor-v10 canonical hardened release overlay missing: " + str(LAB_RELEASE))
    try:
        py_compile.compile(str(LAB_RELEASE), doraise=True)
    except py_compile.PyCompileError as exc:
        raise RuntimeError("doctor-v10 canonical hardened overlay syntax invalid: " + str(exc)) from exc


def _emit_deep_failure(attempts: list[dict], reasons: list[str]) -> None:
    last = attempts[-1] if attempts else {}
    v9.emit("doctor-v10-deep-failure.json", {
        "verdict": "RED",
        "attempts": attempts,
        "last_reasons": reasons,
        "last_shadow": last.get("shadow", {}),
        "last_critical": last.get("critical", {}),
        "last_historical_replay": last.get("historical_replay", {}),
        "worst_pairs": last.get("worst_pairs", []),
    })


def deep_lab_self_heal(wasm: Path, corpus: Path, base_lab) -> dict:
    """Search approved candidate families until the deep lab is GREEN."""
    attempts: list[dict] = []
    original_release_path = v9.RELEASE
    original_d_release = v9.d.RELEASE

    def evaluate(label: str) -> dict:
        report = base_lab(wasm, corpus)
        row = {
            "candidate": label,
            "verdict": report.get("verdict"),
            "quality": v9.quality(report),
            "shadow": report.get("shadow", {}),
            "critical": report.get("critical", {}),
            "historical_replay": report.get("historical_replay", {}),
            "worst_pairs": report.get("worst_pairs", [])[:10],
        }
        attempts.append(row)
        v9.emit("doctor-v10-deep-attempt.json", row)
        return report

    def accept(report: dict) -> dict | None:
        if report.get("verdict") == "GREEN":
            v9.emit("doctor-v10-deep-history.json", {"attempts": attempts, "verdict": "GREEN"})
            return report
        return None

    try:
        report = evaluate("v9-selected")
        accepted = accept(report)
        if accepted is not None:
            return accepted

        v9.RELEASE = LAB_RELEASE
        v9.d.RELEASE = LAB_RELEASE
        v9.build_candidate(wasm)
        v9.d.structural(wasm)
        report = evaluate("canonical-hardened-overlay")
        accepted = accept(report)
        if accepted is not None:
            return accepted

        v9.RELEASE = original_release_path
        v9.d.RELEASE = original_d_release
        reasons = diagnose(report)

        for repair_round in range(1, 4):
            fixed, detail = v9.d.semantic_repair(reasons)
            v9.emit(f"doctor-v10-deep-repair-{repair_round}.json", {
                "reasons": reasons,
                "repaired": fixed,
                "detail": detail,
            })
            if not fixed:
                break
            v9.build_candidate(wasm)
            v9.d.structural(wasm)
            report = evaluate(f"v9-repair-{repair_round}")
            accepted = accept(report)
            if accepted is not None:
                return accepted
            reasons = diagnose(report)

        _emit_deep_failure(attempts, reasons)
        v9.emit("doctor-v10-deep-history.json", {"attempts": attempts, "verdict": "RED"})
        raise RuntimeError(
            "doctor-v10: deep lab remained non-GREEN after candidate ladder; "
            + (",".join(reasons) if reasons else "no-classifiable-failure")
        )
    finally:
        if not attempts or attempts[-1].get("verdict") != "GREEN":
            v9.RELEASE = original_release_path
            v9.d.RELEASE = original_d_release


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
