#!/usr/bin/env python3
"""Track-2 release builder v4: keep numeric equivalence gated by factual guards."""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release_v3 as v3


def patch() -> None:
    # Start from the already-vetted v3 release path, including the explicit
    # trailing-negation/unrelated-tail guard.
    v3.patch()

    # Critical ordering fix: the fast scorer's numeric-equivalence shortcut
    # previously lifted an answer to >=0.95 even when vr_question_guard had
    # correctly detected a mutation. That made numeric answers ending in
    # "not" or containing the synthetic distractor tail score identically to
    # the clean answer. Only allow the lift when the guard is effectively clean.
    marker = "if safe_numeric_equiv{let lifted=vr_safe_pow(base.max(0.95));return(lifted,base,1.0,qg);}"
    replacement = "if safe_numeric_equiv && qg >= 0.999{let lifted=vr_safe_pow(base.max(0.95));return(lifted,base,1.0,qg);}"
    if marker not in build_candidate.WRAPPER:
        raise RuntimeError("v4 patch: numeric-equivalence lift marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(marker, replacement, 1)


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
