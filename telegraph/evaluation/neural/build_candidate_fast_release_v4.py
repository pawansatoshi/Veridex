#!/usr/bin/env python3
"""Track-2 release builder v4: keep numeric equivalence gated by factual guards."""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release_v3 as v3


def _replace_function(src: str, marker: str, replacement: str) -> str:
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"v4 patch: function marker not found: {marker}")
    brace = src.find("{", start)
    if brace < 0:
        raise RuntimeError(f"v4 patch: opening brace not found: {marker}")
    depth = 0
    in_string = False
    escaped = False
    i = brace
    while i < len(src):
        ch = src[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return src[:start] + replacement + src[i + 1:]
        i += 1
    raise RuntimeError(f"v4 patch: unmatched braces: {marker}")


_SYNC_RANK = r'''#[no_mangle]
pub unsafe extern "C" fn rank_answer(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->f32{
    let score=veridex_score(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len).0;
    if score<=0.0{return 0.0;}
    let gt=read_str(gt_ptr,gt_len);
    let answer=read_str(ma_ptr,ma_len);
    let gt_tail=vr_release_tail_contamination(gt.as_bytes());
    let answer_tail=vr_release_tail_contamination(answer.as_bytes());
    let direct_predicate_conflict=if gt_tail||answer_tail{
        false
    }else if vr_has_word(gt.as_bytes(),b"not")||vr_has_word(gt.as_bytes(),b"never")||vr_has_word(answer.as_bytes(),b"not")||vr_has_word(answer.as_bytes(),b"never"){
        false
    }else{
        match(vr_release_predicate_polarity(gt.as_bytes()),vr_release_predicate_polarity(answer.as_bytes())){
            (Some(g),Some(a))=>g!=a,
            _=>false
        }
    };
    if gt_tail||answer_tail{score.min(0.20)}
    else if direct_predicate_conflict{score.min(0.15)}
    else{score}
}'''

_SYNC_BREAKDOWN = r'''#[no_mangle]
pub unsafe extern "C" fn breakdown_answer(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->i32{
    let(mut f,b,fg,qg)=veridex_score(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);
    let gt=read_str(gt_ptr,gt_len);
    let answer=read_str(ma_ptr,ma_len);
    let gt_tail=vr_release_tail_contamination(gt.as_bytes());
    let answer_tail=vr_release_tail_contamination(answer.as_bytes());
    let direct_predicate_conflict=if gt_tail||answer_tail{
        false
    }else if vr_has_word(gt.as_bytes(),b"not")||vr_has_word(gt.as_bytes(),b"never")||vr_has_word(answer.as_bytes(),b"not")||vr_has_word(answer.as_bytes(),b"never"){
        false
    }else{
        match(vr_release_predicate_polarity(gt.as_bytes()),vr_release_predicate_polarity(answer.as_bytes())){
            (Some(g),Some(a))=>g!=a,
            _=>false
        }
    };
    if gt_tail||answer_tail{f=f.min(0.20)}
    else if direct_predicate_conflict{f=f.min(0.15)}
    VERIDEX_BREAKDOWN[0]=b;
    VERIDEX_BREAKDOWN[1]=fg;
    VERIDEX_BREAKDOWN[2]=qg;
    VERIDEX_BREAKDOWN[3]=f;
    VERIDEX_BREAKDOWN[4]=f;
    core::ptr::addr_of_mut!(VERIDEX_BREAKDOWN) as *mut f32 as i32
}'''


def patch() -> None:
    # Start from the already-vetted v3 release path, including the explicit
    # trailing-negation/unrelated-tail guard and generalized predicate rule.
    v3.patch()

    # Keep rank_answer and breakdown_answer semantically identical at the
    # exported boundary. The tournament treats breakdown[4] as an invariant
    # copy of rank_answer, so both exports must apply the same integrity and
    # predicate caps.
    build_candidate.WRAPPER = _replace_function(
        build_candidate.WRAPPER,
        'pub unsafe extern "C" fn rank_answer(',
        _SYNC_RANK,
    )
    build_candidate.WRAPPER = _replace_function(
        build_candidate.WRAPPER,
        'pub unsafe extern "C" fn breakdown_answer(',
        _SYNC_BREAKDOWN,
    )

    # Critical ordering fix: the fast scorer's numeric-equivalence shortcut
    # previously lifted an answer to >=0.95 even when vr_question_guard had
    # correctly detected a mutation. Only allow the lift when the guard is
    # effectively clean.
    marker = "if safe_numeric_equiv{let lifted=vr_safe_pow(base.max(0.95));return(lifted,base,1.0,qg);}"
    replacement = "if safe_numeric_equiv && qg >= 0.999{let lifted=vr_safe_pow(base.max(0.95));return(lifted,base,1.0,qg);}"
    if marker not in build_candidate.WRAPPER:
        raise RuntimeError("v4 patch: numeric-equivalence lift marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(marker, replacement, 1)


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
