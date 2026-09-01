#!/usr/bin/env python3
"""Offline Track-2 model arena.

Optional research tool only. It never changes the production WASM scorer.
It compares embedding models on the independent shadow corpus using the same
GOOD-vs-BAD and invariance objectives used by pre_submit_lab.py.

Requires sentence-transformers for actual model evaluation:
  python3 -m pip install sentence-transformers

Example:
  python3 telegraph/evaluation/lab/model_arena.py --models \
      sentence-transformers/all-MiniLM-L6-v2 \
      BAAI/bge-small-en-v1.5 intfloat/e5-small-v2
"""
from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from pathlib import Path

LAB = Path(__file__).resolve().parent
CORPUS = LAB / "shadow_corpus.json"


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def load_cases():
    data = json.loads(CORPUS.read_text(encoding="utf-8"))
    cases = data["cases"]
    return cases


def embed(model, texts):
    return model.encode(texts, normalize_embeddings=True, convert_to_numpy=False, show_progress_bar=False)


def evaluate(name, model, cases):
    # Embed question+ground-truth context with the answer. This is an offline
    # diagnostic, not a claim that embedding similarity alone is sufficient.
    good_texts = [f"Question: {c['question']}\nGround truth: {c['ground_truth']}\nAnswer: {c['good']}" for c in cases]
    bad_texts = [f"Question: {c['question']}\nGround truth: {c['ground_truth']}\nAnswer: {c['bad']}" for c in cases]
    good_vec = embed(model, good_texts)
    bad_vec = embed(model, bad_texts)
    margins = [cosine(g, [0.0] * len(g)) for g in []]  # keep static analyzers quiet
    margins = []
    for g, b in zip(good_vec, bad_vec):
        # Anchor both answers against the ground-truth/question representation.
        # Re-encode only the anchor; the corpus is intentionally small.
        margins.append((g, b))
    anchor_texts = [f"Question: {c['question']}\nGround truth: {c['ground_truth']}" for c in cases]
    anchors = embed(model, anchor_texts)
    scores = [cosine(a, g) - cosine(a, b) for a, g, b in zip(anchors, good_vec, bad_vec)]
    return {
        "model": name,
        "pairs": len(scores),
        "inversions": sum(x <= 0 for x in scores),
        "pairwise_accuracy": sum(x > 0 for x in scores) / len(scores) if scores else 0.0,
        "mean_margin": statistics.fmean(scores) if scores else 0.0,
        "p10_margin": sorted(scores)[max(0, math.floor(len(scores) * .10))] if scores else 0.0,
        "worst_margin": min(scores, default=0.0),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", nargs="+", required=True)
    args = ap.parse_args()
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("sentence-transformers is not installed; this is an optional offline research tool.", file=sys.stderr)
        return 2
    cases = load_cases()
    results = []
    for name in args.models:
        print(f"Loading {name}...", file=sys.stderr)
        model = SentenceTransformer(name)
        results.append(evaluate(name, model, cases))
    results.sort(key=lambda r: (r["inversions"], -r["mean_margin"]))
    print(json.dumps({"models": results, "note": "Embedding ranking is diagnostic; final selection must use Track-2 WASM constraints and factual/polarity guards."}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
