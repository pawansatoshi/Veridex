#!/usr/bin/env python3
"""Build the bounded-performance Veridex Track 2 neural candidate.

This builder intentionally patches the pinned baseline source files themselves.
MAX_SEQ_LEN is defined in src/tokenizer.rs and the transformer layer count plus
position-table assertion are in src/embed.rs; they are not part of the Veridex
wrapper string. The Veridex wrapper remains authoritative and is supplied by
build_candidate.py + build_candidate_compat.py.
"""
from __future__ import annotations

import argparse
import pathlib
import re
import shutil
import subprocess
import tempfile

import build_candidate
import build_candidate_compat  # applies the current authoritative wrapper patches

BASELINE_REPO = build_candidate.BASELINE_REPO
BASELINE_COMMIT = build_candidate.BASELINE_COMMIT


def run(cmd: list[str], cwd: pathlib.Path) -> None:
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def patch_fast_sources(upstream: pathlib.Path) -> None:
    tokenizer = upstream / "src" / "tokenizer.rs"
    text = tokenizer.read_text(encoding="utf-8")
    text, n = re.subn(
        r"pub\s+const\s+MAX_SEQ_LEN\s*:\s*usize\s*=\s*\d+\s*;",
        "pub const MAX_SEQ_LEN: usize = 64;",
        text, count=1,
    )
    if n != 1:
        raise SystemExit("fast path: MAX_SEQ_LEN definition not found in pinned tokenizer.rs")
    tokenizer.write_text(text, encoding="utf-8")

    embed = upstream / "src" / "embed.rs"
    text = embed.read_text(encoding="utf-8")

    text, n = re.subn(
        r"let\s+num_layers\s*=\s*read_u32\(w,\s*&mut\s*c\)\s+as\s+usize\s*;",
        "let num_layers = core::cmp::min(read_u32(w, &mut c) as usize, 5);",
        text, count=1,
    )
    if n != 1:
        raise SystemExit("fast path: transformer layer-count definition not found in pinned embed.rs")

    # Keep the complete 128-row position table consumption so the binary cursor
    # stays aligned; only the tokenizer/model execution window is reduced to 64.
    text, n = re.subn(
        r"assert_eq!\(\s*num_positions,\s*MAX_SEQ_LEN,\s*\n?\s*\"weights\.bin position table size doesn't match tokenizer::MAX_SEQ_LEN\"\s*\n?\s*\);",
        'assert!(num_positions >= MAX_SEQ_LEN, "weights.bin position table is shorter than tokenizer::MAX_SEQ_LEN");',
        text, count=1,
    )
    if n != 1:
        raise SystemExit("fast path: position-table assertion not found in pinned embed.rs")

    embed.write_text(text, encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    out = pathlib.Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="veridex-neural-fast-") as td:
        root = pathlib.Path(td)
        upstream = root / "baseline"
        run(["git", "clone", "--filter=blob:none", BASELINE_REPO, str(upstream)], root)
        run(["git", "checkout", BASELINE_COMMIT], upstream)

        patch_fast_sources(upstream)

        lib = upstream / "src" / "lib.rs"
        text = lib.read_text(encoding="utf-8")
        replacements = (
            ('pub unsafe extern "C" fn rank_answer(', 'pub unsafe extern "C" fn rank_answer_base('),
            ('pub unsafe extern "C" fn breakdown_answer(', 'pub unsafe extern "C" fn breakdown_answer_base('),
            ('pub unsafe extern "C" fn alloc(', 'pub unsafe extern "C" fn baseline_alloc('),
            ('pub unsafe extern "C" fn dealloc(', 'pub unsafe extern "C" fn baseline_dealloc('),
        )
        for old, new in replacements:
            if old not in text:
                raise SystemExit(f"unexpected pinned baseline lib.rs: missing {old}")
            text = text.replace(old, new, 1)
        lib.write_text(text + build_candidate.WRAPPER, encoding="utf-8")

        run(["rustup", "target", "add", "wasm32-unknown-unknown"], upstream)
        run(["cargo", "build", "--release", "--target", "wasm32-unknown-unknown", "--features", "real_weights"], upstream)

        built = upstream / "target" / "wasm32-unknown-unknown" / "release" / "telegraph_scoring.wasm"
        if not built.exists():
            raise SystemExit(f"build succeeded but output missing: {built}")
        shutil.copy2(built, out)

        print(f"upstream commit: {BASELINE_COMMIT}")
        print("fast path: MAX_SEQ_LEN=64, max transformer layers=5")
        print(f"output: {out}")
        print(f"bytes: {out.stat().st_size}")


if __name__ == "__main__":
    main()
