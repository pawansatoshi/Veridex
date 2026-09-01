#!/usr/bin/env python3
"""Track-2 release doctor v9: bounded candidate tournament + deep gate.

Searches three generalized scorer variants on a small deterministic suite.
Scores the selected winner on a separate deterministic 256-case deep suite,
then runs the authoritative Telegraph gates. The larger generated corpus is
kept as evidence but is not blindly executed through an expensive neural WASM
for every candidate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import track2_release_doctor_v3 as d

ROOT = Path(__file__).resolve().parents[3]
LAB = ROOT / "telegraph/evaluation/lab"
RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v3.py"
FULL_CORPUS = LAB / "shadow_corpus.generated.json"
FAST_CORPUS = LAB / "shadow_corpus.fast.generated.json"
DEEP_CORPUS = LAB / "shadow_corpus.deep.generated.json"
WASM_DEFAULT = ROOT / "telegraph/evaluation/veridex-track2-final.wasm"
SAMPLER = LAB / "sample_shadow_corpus.py"

CANDIDATES = [
    ("current", None, None),
    ("balanced", "0.025", "0.14"),
    ("strong", "0.015", "0.08"),
]


def emit(name: str, data: object) -> None:
    d.EVID.mkdir(parents=True, exist_ok=True)
    payload = data if isinstance(data, str) else json.dumps(data, indent=2, ensure_ascii=False)
    (d.EVID / name).write_text(payload, encoding="utf-8")


def set_material(factor: str | None, cap: str | None) -> None:
    text = RELEASE.read_text(encoding="utf-8")
    if factor is None or cap is None:
        return
    pattern = r"const VR_MATERIAL_FACTOR:f32=[0-9.]+;\nconst VR_MATERIAL_CAP:f32=[0-9.]+;"
    replacement = f"const VR_MATERIAL_FACTOR:f32={factor};\nconst VR_MATERIAL_CAP:f32={cap};"
    new, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise RuntimeError("doctor-v9: material constants not found")
    RELEASE.write_text(new, encoding="utf-8")


def quality(report: dict) -> tuple:
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


def build_candidate(wasm: Path) -> None:
    d.build(wasm)
    d.structural(wasm)


def prepare_sample(input_path: Path, output_path: Path, limit: int) -> None:
    p = d.run([
        sys.executable,
        str(SAMPLER),
        "--input", str(input_path),
        "--output", str(output_path),
        "--limit", str(limit),
    ], 120, 1)
    if p.returncode:
        raise RuntimeError("shadow-sampler: " + (p.stderr.strip() or p.stdout.strip()))


def prepare_corpora(fast_limit: int, deep_limit: int) -> None:
    d.generate(1)
    prepare_sample(FULL_CORPUS, FAST_CORPUS, fast_limit)
    prepare_sample(FULL_CORPUS, DEEP_CORPUS, deep_limit)
    d.CORPUS = FAST_CORPUS
    emit("shadow-sample-summary.json", {
        "full_pairs": json.loads(FULL_CORPUS.read_text(encoding="utf-8")).get("output_pairs", 0),
        "fast_limit": fast_limit,
        "deep_limit": deep_limit,
        "fast_corpus": str(FAST_CORPUS),
        "deep_corpus": str(DEEP_CORPUS),
    })


def lab_once(wasm: Path, corpus: Path) -> dict:
    d.CORPUS = corpus
    try:
        return d.run_lab(wasm)
    except RuntimeError:
        if d.REPORT.exists():
            try:
                return json.loads(d.REPORT.read_text(encoding="utf-8"))
            except Exception:
                pass
        raise


def authoritative(wasm: Path) -> None:
    d.gate("preflight", ["node", str(d.PRE), str(wasm), str(d.PRIMARY)])
    d.gate("tournament", ["node", str(d.TOUR), str(wasm), str(d.PRIMARY)])
    d.gate("contract-preflight", ["node", str(d.PRE), str(wasm), str(d.CONTRACT)])
    d.gate("contract-tournament", ["node", str(d.TOUR), str(wasm), str(d.CONTRACT)])
    d.prepare_checker()
    d.checker(wasm, d.CHECKER / "examples/hard.json", "public-hard-json")
    d.gate("mutation", ["node", str(d.MUT), str(wasm), str(d.PRIMARY)])
    d.gate("live-risk", ["node", str(d.LIVE), str(wasm), str(d.PRIMARY)])
    d.checker(wasm, d.PRIMARY, "wazero")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wasm", type=Path, default=WASM_DEFAULT)
    ap.add_argument("--fast-limit", type=int, default=48)
    ap.add_argument("--deep-limit", type=int, default=256)
    ap.add_argument("--json", action="store_true", help="emit JSON-compatible doctor output (accepted for CI compatibility)")
    args = ap.parse_args()

    if not 16 <= args.fast_limit <= args.deep_limit <= 512:
        raise SystemExit("require 16 <= fast-limit <= deep-limit <= 512")

    d.RELEASE = RELEASE
    d.EVID.mkdir(parents=True, exist_ok=True)
    original_source = RELEASE.read_text(encoding="utf-8")

    prepare_corpora(args.fast_limit, args.deep_limit)

    history = []
    best_quality = None
    best_report = None
    winner = None
    winner_source = original_source

    for label, factor, cap in CANDIDATES:
        RELEASE.write_text(original_source, encoding="utf-8")
        set_material(factor, cap)
        try:
            build_candidate(args.wasm)
            report = lab_once(args.wasm, FAST_CORPUS)
            q = quality(report)
            row = {"label": label, "factor": factor, "cap": cap, "quality": q, "report": report}
            history.append(row)
            emit("doctor-v9-candidate.json", row)
            if best_quality is None or q < best_quality:
                best_quality = q
                best_report = report
                winner = (label, factor, cap)
                winner_source = RELEASE.read_text(encoding="utf-8")
                emit("doctor-v9-best.json", {"label": label, "factor": factor, "cap": cap, "quality": q})
        except Exception as exc:
            row = {"label": label, "factor": factor, "cap": cap, "error": str(exc)}
            history.append(row)
            emit("doctor-v9-candidate-error.json", row)

    if winner is None or best_report is None:
        RELEASE.write_text(original_source, encoding="utf-8")
        raise RuntimeError("doctor-v9: no candidate could be built and evaluated")

    RELEASE.write_text(winner_source, encoding="utf-8")
    build_candidate(args.wasm)
    deep = lab_once(args.wasm, DEEP_CORPUS)
    emit("deep-lab-final.json", deep)
    if deep.get("verdict") != "GREEN":
        raise RuntimeError("doctor-v9: selected candidate failed deep 256-case lab")

    authoritative(args.wasm)

    sha = hashlib.sha256(args.wasm.read_bytes()).hexdigest()
    result = {
        "verdict": "GREEN",
        "winner": {"label": winner[0], "factor": winner[1], "cap": winner[2]},
        "fast_quality": best_quality,
        "fast_report": best_report,
        "deep": deep,
        "sha256": sha,
        "bytes": args.wasm.stat().st_size,
        "candidate_history": history,
        "corpus_policy": "full corpus retained as evidence; 48-case search + 256-case stratified deep WASM execution",
    }
    (ROOT / "telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt").write_text(
        f"{sha}  {args.wasm.name}\nsource commit: {__import__('os').getenv('GITHUB_SHA', 'local')}\n",
        encoding="utf-8",
    )
    emit("release-doctor-final.json", result)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
