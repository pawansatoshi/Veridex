#!/usr/bin/env python3
"""Release wrapper for the bounded-performance Track 2 builder."""
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

_ODDS_SHARPEN = "fn vr_safe_pow(score:f32)->f32{if !score.is_finite(){return 0.0;}if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let t=score.clamp(0.0,1.0);let a=libm::powf(t,3.0);let b=libm::powf(1.0-t,3.0);let d=a+b;if !d.is_finite()||d<=0.0{return 0.0;}let y=a/d;if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"

def _replace_safe_pow(wrapper: str) -> str:
    marker = "fn vr_safe_pow(score:f32)->f32{"
    start = wrapper.find(marker)
    if start < 0:
        raise SystemExit("release wrapper: vr_safe_pow function not found")
    depth = 0
    in_string = False
    escape = False
    end = None
    i = start
    while i < len(wrapper):
        ch = wrapper[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        i += 1
    if end is None:
        raise SystemExit("release wrapper: could not find vr_safe_pow closing brace")
    return wrapper[:start] + _ODDS_SHARPEN + wrapper[end:]


def patch_release_guards() -> None:
    _ORIGINAL_FAST_PATCH()
    if _ORIGINAL_CONFLICT not in build_candidate.WRAPPER:
        raise SystemExit("release wrapper: expected binary predicate guard marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(_ORIGINAL_CONFLICT, _GENERIC_CONFLICT, 1)
    # Replace only the safe_pow function itself. Do not delete helper functions
    # that the compatibility/fast patches deliberately place before veridex_score.
    build_candidate.WRAPPER = _replace_safe_pow(build_candidate.WRAPPER)


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch_release_guards
    build_candidate_fast.main()
