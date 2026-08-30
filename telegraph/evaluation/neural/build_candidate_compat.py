#!/usr/bin/env python3
"""Compatibility entry point for the pinned baseline build.

The official baseline is intentionally kept pinned and otherwise untouched.
This adapter fixes one Rust-2024 compile incompatibility in the Veridex wrapper:
computing the mutable scratch-array length must not create an implicit reference
to a mutable static. The replacement uses the already-declared compile-time
slot constants, preserving the exact scratch-buffer size and runtime behavior.
"""
from __future__ import annotations

import sys

from build_candidate import main, WRAPPER

OLD = "(start, start + VR_SCRATCH.len())"
NEW = "(start, start + (VR_SCRATCH_SLOT * VR_SCRATCH_SLOTS))"

if OLD not in WRAPPER:
    raise SystemExit("expected scratch-range expression not found; baseline wrapper changed")

# Patch the generated upstream lib.rs payload in memory only. The upstream
# repository remains pinned and unmodified on disk until build_candidate writes
# the wrapper, so provenance remains explicit and reproducible.
import build_candidate
build_candidate.WRAPPER = WRAPPER.replace(OLD, NEW, 1)

if __name__ == "__main__":
    sys.argv[0] = "build_candidate.py"
    main()
