#!/usr/bin/env python3
"""0.2+ release candidate derived directly from the known-good 14.0 scorer.

This deliberately composes the frozen 14.0 release wrapper rather than
rebuilding the lab/neural-hybrid path. The only scoring change is a bounded
consistency credit for answers whose explicit binary/predicate/directional
semantics agree with the ground truth and pass the existing contradiction
rails. This is meant to raise true-answer recall on semantic paraphrases while
leaving conflicting answers on their existing rejection paths.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release


def patch_release_0p2() -> None:
    """Apply the frozen 14.0 patch, then add one bounded consistency credit."""
    build_candidate_fast_release.patch_release_guards()

    marker = """    let qg=vr_question_guard(q.as_bytes(),gb,ab);\n    let shaped_base=if safe_numeric_equiv{base.max(0.95)}else{base};\n    let mut final_score=vr_safe_pow(shaped_base*fg*qg);"""
    replacement = """    let qg=vr_question_guard(q.as_bytes(),gb,ab);\n    let binary_agreement=vr_question_is_binary(q.as_bytes())&&match(vr_first_binary_polarity(gb),vr_first_binary_polarity(ab)){(Some(g),Some(a))=>g==a,_=>false};\n    let predicate_agreement=match(vr_release_predicate_polarity(gb),vr_release_predicate_polarity(ab)){(Some(g),Some(a))=>g==a,_=>false};\n    let direction_agreement=match(vr_direction(gb),vr_direction(ab)){(Some(g),Some(a))=>g==a,_=>false};\n    let consistency_agreement=binary_agreement||predicate_agreement||direction_agreement;\n    let shaped_base=if safe_numeric_equiv{base.max(0.95)}else if consistency_agreement&&base>=0.35{(0.35+0.65*base).min(0.98)}else{base};\n    let mut final_score=vr_safe_pow(shaped_base*fg*qg);"""

    if marker not in build_candidate.WRAPPER:
        raise SystemExit("0p2: frozen 14.0 score marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(marker, replacement, 1)


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch_release_0p2
    build_candidate_fast.main()
