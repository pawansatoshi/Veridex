#!/usr/bin/env python3
"""Release wrapper for the bounded-performance Track 2 builder.

Runs the established fast builder, then applies generic binary-question
predicate consistency plus a strictly increasing score-contrast transform.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast

_ORIGINAL_FAST_PATCH = build_candidate_fast.patch_semantic_guards
_ORIGINAL_CONFLICT = (
    "fn vr_question_predicate_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{"
    "if !vr_question_is_binary(q){return false;}"
    "match(vr_predicate_polarity(gt),vr_predicate_polarity(ans))"
    "{(Some(g),Some(a))=>g!=a,_=>false}}"
)

_GENERIC_CONFLICT = r'''fn vr_question_predicate_polarity(q:&[u8])->Option<bool>{
    let p=vr_predicate_polarity(q);
    match p{Some(v)=>{if vr_has_word(q,b"not"){Some(!v)}else{Some(v)}},None=>None}
}
fn vr_answer_predicate_polarity(ans:&[u8])->Option<bool>{
    let p=vr_predicate_polarity(ans);
    match p{Some(v)=>{if vr_has_word(ans,b"not"){Some(!v)}else{Some(v)}},None=>None}
}
fn vr_question_predicate_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_question_is_binary(q){return false;}
    let direct=match(vr_predicate_polarity(gt),vr_predicate_polarity(ans)){
        (Some(g),Some(a))=>g!=a,
        _=>false
    };
    if direct{return true;}
    match(vr_question_predicate_polarity(q),vr_answer_predicate_polarity(ans),vr_first_binary_polarity(ans),vr_first_binary_polarity(gt)){
        (Some(qp),Some(ap),Some(bp),_)=>{let expected=if bp{qp}else{!qp};ap!=expected},
        (Some(qp),Some(ap),_,Some(gb))=>{let expected=if gb{qp}else{!qp};ap!=expected},
        _=>false
    }
}'''

# Accept both the baseline's original transform and the previously patched
# release transform. This avoids brittle coupling to import-time wrapper order.
_OLD_SHARPEN_BASELINE = "fn vr_safe_pow(score:f32)->f32{if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let y=libm::powf(score,1.18);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"
_OLD_SHARPEN_RELEASE = "fn vr_safe_pow(score:f32)->f32{if !score.is_finite(){return 0.0;}if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let t=score.clamp(0.0,1.0);let lift=t*t*(3.0-2.0*t)*(1.0-t);let y=t+lift;if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"
_CONTRAST_SHARPEN = "fn vr_safe_pow(score:f32)->f32{if !score.is_finite(){return 0.0;}if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let t=score.clamp(0.0,1.0);let y=t*t*(3.0-2.0*t);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"


def patch_release_guards() -> None:
    """Run the original fast patcher and add release-only corrections."""
    _ORIGINAL_FAST_PATCH()
    if _ORIGINAL_CONFLICT not in build_candidate.WRAPPER:
        raise SystemExit("release wrapper: expected binary predicate guard marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(
        _ORIGINAL_CONFLICT, _GENERIC_CONFLICT, 1
    )
    if _OLD_SHARPEN_BASELINE in build_candidate.WRAPPER:
        build_candidate.WRAPPER = build_candidate.WRAPPER.replace(
            _OLD_SHARPEN_BASELINE, _CONTRAST_SHARPEN, 1
        )
    elif _OLD_SHARPEN_RELEASE in build_candidate.WRAPPER:
        build_candidate.WRAPPER = build_candidate.WRAPPER.replace(
            _OLD_SHARPEN_RELEASE, _CONTRAST_SHARPEN, 1
        )
    else:
        raise SystemExit("release wrapper: no supported score transform marker found")


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch_release_guards
    build_candidate_fast.main()
