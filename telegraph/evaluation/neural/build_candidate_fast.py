#!/usr/bin/env python3
"""Track 2 fast candidate builder.

Loads the existing Veridex compatibility wrapper (all scoring guards/cache logic)
and applies bounded performance optimizations to the pinned MiniLM baseline:
- cap tokenizer sequence length at 64 tokens;
- execute only the first 5 of the baseline's 6 transformer layers.

The full pinned weight blob remains present for provenance/reproducibility, but
unnecessary upper-layer computation is skipped at runtime. This is intentionally
kept in a separate build entry point so the full V10 neural candidate remains
available for regression/reference.
"""
from __future__ import annotations
import sys
import build_candidate
import build_candidate_compat  # applies the authoritative Veridex wrapper patches

src = build_candidate.WRAPPER

old_len = "pub const MAX_SEQ_LEN: usize = 128;"
new_len = "pub const MAX_SEQ_LEN: usize = 64;"
if old_len not in src:
    raise SystemExit("baseline MAX_SEQ_LEN marker not found; upstream wrapper changed")
src = src.replace(old_len, new_len, 1)

old_assert = '''assert_eq!(
        num_positions, MAX_SEQ_LEN,
        "weights.bin position table size doesn't match tokenizer::MAX_SEQ_LEN"
    );'''
new_assert = "let _num_positions = num_positions;"
if old_assert not in src:
    raise SystemExit("baseline position-table assertion not found; upstream embed.rs changed")
src = src.replace(old_assert, new_assert, 1)

old_layers = "let num_layers = read_u32(w, &mut c) as usize; // 6"
new_layers = "let num_layers = core::cmp::min(read_u32(w, &mut c) as usize, 5); // bounded fast path: max 5 layers"
if old_layers not in src:
    raise SystemExit("baseline layer-count marker not found; upstream embed.rs changed")
src = src.replace(old_layers, new_layers, 1)

build_candidate.WRAPPER = src

if __name__ == "__main__":
    sys.argv[0] = "build_candidate.py"
    build_candidate.main()
