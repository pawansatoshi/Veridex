#!/usr/bin/env python3
"""Offline Track-2 model arena.

Compares embedding backbones on the same generated/independent corpus. This
is a research gate only; it never modifies the production WASM automatically.
"""
from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from pathlib import Path

LAB = Path(__file__).resolve().parent
SEED_CORPUS = LAB / "shadow_corpus.json"
GENERATED_CORPUS = LAB / "shadow_corpus.generated.json"


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def load_cases(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("cases", [])


def embed(model, texts):
    return model.encode(texts, normalize_embeddings=True, convert_to_numpy=False, show_progress_bar=False)


def evaluate(name, model, cases):
    anchors = embed(model, [f"Question: {c['question']}\nGround truth: {c['ground_truth']}" for c in cases])
    goods = embed(model, [f"Question: {c['question']}\nGround truth: {c['ground_truth']}\nAnswer: {c['good']}" for c in cases])
    bads = embed(model, [f"Question: {c['question']}\nGround truth: {c['ground_truth']}\nAnswer: {c['bad']}" for c in cases])
    margins = [cosine(a, g) - cosine(a, b) for a, g, b in zip(anchors, goods, bads)]
    ordered = sorted(margins)
    n = len(ordered)
    return {
        "model": name, "pairs": n,
        "inversions": sum(x <= 0 for x in ordered),
        "pairwise_accuracy": sum(x > 0 for x in ordered) / n if n else 0.0,
        "mean_margin": statistics.fmean(ordered) if ordered else 0.0,
        "p10_margin": ordered[max(0, math.floor(n * .10))] if n else 0.0,
        "p5_margin": ordered[max(0, math.floor(n * .05))] if n else 0.0,
        "worst_margin": ordered[0] if ordered else 0.0,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", nargs="+", required=True)
    ap.add_argument("--corpus", type=Path, default=None)
    args = ap.parse_args()
    corpus = args.corpus or (GENERATED_CORPUS if GENERATED_CORPUS.exists() else SEED_CORPUS)
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("sentence-transformers is not installed; this is an optional offline research tool.", file=sys.stderr)
        return 2
    cases = load_cases(corpus)
    if not cases:
        print("corpus is empty", file=sys.stderr); return 2
    results = []
    for name in args.models:
        print(f"Loading {name}...", file=sys.stderr)
        results.append(evaluate(name, SentenceTransformer(name), cases))
    results.sort(key=lambda r: (r["inversions"], -r["mean_margin"]))
    print(json.dumps({"corpus": str(corpus), "cases": len(cases), "models": results,
                      "note": "Diagnostic embedding comparison only; final production selection must pass WASM constraints and factual/polarity regression gates."}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
