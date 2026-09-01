#!/usr/bin/env python3
"""Track-2 final release builder: lean live-margin path.

Keep the real MiniLM fast scorer as the primary signal and retain only the
vetted targeted contradiction/polarity/entity/numeric guards from the base
release wrapper. Lab-only material caps, tail-contamination penalties, and a
second rewritten score pipeline are intentionally excluded from the release
artifact.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release as base


def patch() -> None:
    # The base release wrapper already delegates to the original fast scorer
    # and installs the targeted release guards. Do not layer v2/v3 lab logic
    # on top of it; that path was correlated with the live-margin regression.
    base.patch_release_guards()
    build_candidate.WRAPPER = build_candidate.WRAPPER


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
