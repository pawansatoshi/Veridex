#!/usr/bin/env python3
"""Standalone Track-2 release doctor v9.

Runs a deterministic candidate tournament without the legacy nested doctor
control flow. Candidate variants are rebuilt from the pinned baseline and
measured against historical + sampled shadow data. The strongest fast
candidates are then re-tested on the full generated corpus and authoritative
Telegraph gates. No benchmark data or evaluator thresholds are modified.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import track2_release_doctor_v3 as d
import track2_release_doctor_v5 as v5

ROOT = Path(__file__).resolve().parents[3]
LAB = ROOT / "telegraph/evaluation/lab"
RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v3.py"
FULL = LAB / "shadow_corpus.generated.json"
FAST = LAB / "shadow_corpus.fast.generated.json"
WASM_DEFAULT = ROOT / "telegraph/evaluation/veridex-track2-final.wasm"

LADDER = [
    ("0.035", "0.18", "moderate"),
    ("0.030", "0.16", "moderate-strong"),
    ("0.025", "0.14", "strong"),
    ("0.020", "0.12", "strong-cap"),
    ("0.017", "0.10", "aggressive"),
    ("0.015", "0.08", "aggressive-cap"),
    ("0.012", "0.06", "very-aggressive"),
    ("0.010", "0.05", "maximum"),
]
MAX_DEEP_CANDIDATES = 4


def emit(name, data):
    d.EVID.mkdir(parents=True, exist_ok=True)
    (d.EVID / name).write_text(
        data if isinstance(data, str) else json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def set_material(factor, cap):
    text = RELEASE.read_text(encoding="utf-8")
    pat = r"const VR_MATERIAL_FACTOR:f32=[0-9.]+;\nconst VR_MATERIAL_CAP:f32=[0-9.]+;"
    repl = f"const VR_MATERIAL_FACTOR:f32={factor};\nconst VR_MATERIAL_CAP:f32={cap};"
    new, count = re.subn(pat, repl, text, count=1)
    if count != 1:
        raise RuntimeError("doctor-v9: material constants not found")
    RELEASE.write_text(new, encoding="utf-8")


def quality(report):
    s = report.get("shadow", {})
    c = report.get("critical", {})
    h = report.get("historical_replay", {})
    return (
        int(s.get("inversions", 10**9)),
        int(c.get("inversions", 10**9)),
        int(h.get("inversions", 10**9)),
        -float(s.get("mean_margin", -1.0)),
        -float(s.get("p10_margin", -1.0)),
        -float(s.get("worst_margin", -1.0)),
        int(s.get("near_ties_lt_0_02", 10**9)),
    )


def lab_once(wasm, corpus):
    d.CORPUS = corpus
    try:
        return d.run_lab(wasm)
    except RuntimeError:
        if d.REPORT.exists():
            return json.loads(d.REPORT.read_text(encoding="utf-8"))
        raise


def build_clean(wasm):
    d.build(wasm)
    d.structural(wasm)


def authoritative(wasm):
    d.gate("preflight", ["node", str(d.PRE), str(wasm), str(d.PRIMARY)])
    d.gate("tournament", ["node", str(d.TOUR), str(wasm), str(d.PRIMARY)])
    d.gate("contract-preflight", ["node", str(d.PRE), str(wasm), str(d.CONTRACT)])
    d.gate("contract-tournament", ["node", str(d.TOUR), str(wasm), str(d.CONTRACT)])
    d.prepare_checker()
    d.checker(wasm, d.CHECKER / "examples/hard.json", "public-hard-json")
    d.gate("mutation", ["node", str(d.MUT), str(wasm), str(d.PRIMARY)])
    d.gate("live-risk", ["node", str(d.LIVE), str(wasm), str(d.PRIMARY)])
    d.checker(wasm, d.PRIMARY, "wazero")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wasm", type=Path, default=WASM_DEFAULT)
    ap.add_argument("--fast-limit", type=int, default=128)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    d.RELEASE = RELEASE
    RELEASE.parent.mkdir(parents=True, exist_ok=True)
    d.EVID.mkdir(parents=True, exist_ok=True)

    original_source = RELEASE.read_text(encoding="utf-8")
    d.generate(1)
    v5._sample_full(args.fast_limit)

    candidates = [("current", None, None)] + [(label, factor, cap) for factor, cap, label in LADDER]
    history = []

    for label, factor, cap in candidates:
        try:
            RELEASE.write_text(original_source, encoding="utf-8")
            if factor is not None:
                set_material(factor, cap)
            build_clean(args.wasm)
            report = lab_once(args.wasm, FAST)
            row = {"label": label, "factor": factor, "cap": cap, "quality": quality(report), "report": report}
            history.append(row)
            emit("doctor-v9-candidate-last.json", row)
        except Exception as exc:
            row = {"label": label, "factor": factor, "cap": cap, "error": str(exc)}
            history.append(row)
            emit("doctor-v9-candidate-error.json", row)

    successful = [r for r in history if "quality" in r]
    successful.sort(key=lambda r: tuple(r["quality"]))
    if not successful:
        RELEASE.write_text(original_source, encoding="utf-8")
        raise RuntimeError("doctor-v9: no buildable candidate")

    deep_attempts = []
    for rank, winner in enumerate(successful[:MAX_DEEP_CANDIDATES], start=1):
        try:
            RELEASE.write_text(original_source, encoding="utf-8")
            if winner.get("factor") is not None:
                set_material(winner["factor"], winner["cap"])
            build_clean(args.wasm)
            d.generate(1)
            deep = lab_once(args.wasm, FULL)
            attempt = {
                "rank": rank,
                "winner": {k: winner.get(k) for k in ("label", "factor", "cap", "quality")},
                "deep": deep,
            }
            deep_attempts.append(attempt)
            emit(f"doctor-v9-deep-{rank}.json", attempt)
            if deep.get("verdict") != "GREEN":
                continue

            try:
                authoritative(args.wasm)
            except Exception as exc:
                attempt["authoritative_error"] = str(exc)
                emit(f"doctor-v9-authoritative-{rank}.json", attempt)
                continue

            sha = hashlib.sha256(args.wasm.read_bytes()).hexdigest()
            result = {
                "verdict": "GREEN",
                "winner": attempt["winner"],
                "deep": deep,
                "sha256": sha,
                "bytes": args.wasm.stat().st_size,
                "candidate_count": len(history),
                "deep_candidates_tested": rank,
                "deep_attempts": deep_attempts,
            }
            (ROOT / "telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt").write_text(
                f"{sha}  {args.wasm.name}\nsource commit: {__import__('os').getenv('GITHUB_SHA','local')}\n",
                encoding="utf-8",
            )
            emit("release-doctor-final.json", result)
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return 0
        except Exception as exc:
            attempt = {"rank": rank, "winner": winner, "error": str(exc)}
            deep_attempts.append(attempt)
            emit(f"doctor-v9-deep-error-{rank}.json", attempt)

    RELEASE.write_text(original_source, encoding="utf-8")
    raise RuntimeError("doctor-v9: no fast-ranked candidate survived deep + authoritative verification")


if __name__ == "__main__":
    raise SystemExit(main())
