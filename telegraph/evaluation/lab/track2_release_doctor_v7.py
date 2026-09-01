#!/usr/bin/env python3
"""Canonical Track-2 release doctor v7.

Uses the case-aware v6 lab lifecycle while building the production candidate
through the hardened release-builder v2. This keeps the scorer experiment
reversible and makes candidate/doctor behavior explicit.
"""
from __future__ import annotations

from pathlib import Path

import track2_release_doctor_v3 as d
import track2_release_doctor_v6 as v6

ROOT = Path(__file__).resolve().parents[3]
d.RELEASE = ROOT / "telegraph/evaluation/neural/build_candidate_fast_release_v2.py"

if __name__ == "__main__":
    raise SystemExit(v6.main())
