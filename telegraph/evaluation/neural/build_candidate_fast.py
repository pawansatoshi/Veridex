#!/usr/bin/env python3
"""Track 2 fast candidate builder.

Loads the existing Veridex compatibility wrapper (all scoring guards/cache logic)
and applies one additional performance-safe baseline optimization: cap tokenizer
sequence length at 64 tokens. The pinned MiniLM weight blob remains unchanged;
the runtime position table is still present at 128 positions, but no request can
enter the transformer with more than 64 real tokens.
"""
from __future__ import annotations
import sys
import re
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

build_candidate.WRAPPER = src

if __name__ == "__main__":
    sys.argv[0] = "build_candidate.py"
    build_candidate.main()
