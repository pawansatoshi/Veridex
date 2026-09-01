#!/usr/bin/env python3
"""Canonical Track-2 release doctor v8.

Uses the v6 case-aware fast/deep lab lifecycle while selecting the reproducible
hardened release overlay builder. The overlay executes the canonical release
builder as a script, preserving its normal pinned baseline and artifact flow.
"""
from __future__ import annotations

from pathlib import Path

import track2_release_doctor_v6 as v6
import track2_release_doctor_v3 as d

ROOT = Path(__file__).resolve().parents[3]
d.RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_lab.py"

if __name__ == "__main__":
    raise SystemExit(v6.main())
