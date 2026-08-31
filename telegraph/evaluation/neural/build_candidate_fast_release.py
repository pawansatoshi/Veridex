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

_MILD_CALIBRATION = "fn vr_safe_pow(score:f32)->f32{if !score.is_finite(){return 0.0;}if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let t=score.clamp(0.0,1.0);let y=t+0.22*t*(1.0-t);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"

_OLD_SAFE_EQ = (
    "let safe_numeric_equiv=vr_safe_numeric_equiv(gb,ab)&&vr_numeric_context(q.as_bytes())"
    "&&!vr_opposite(gb,ab)&&!vr_named_token_conflict(q.as_bytes(),gb,ab);"
)
_NEW_SAFE_EQ = (
    "let safe_numeric_equiv=vr_safe_numeric_equiv(gb,ab)&&vr_numeric_context(q.as_bytes())"
    "&&!vr_opposite(gb,ab)&&!vr_named_token_conflict(q.as_bytes(),gb,ab)"
    "&&!vr_has_any(ab,&[b\"not\",b\"wrong\",b\"incorrect\",b\"different\",b\"opposite\",b\"never\",b\"rejected\",b\"denied\",b\"blocked\"]);"
)

_OLD_LIFT = "if safe_numeric_equiv{let lifted=vr_safe_pow(base.max(0.95));return(lifted,base,1.0,qg);}"
_NEW_LIFT = "if safe_numeric_equiv{let lifted=(base+0.15*(1.0-base)).min(0.97);return(lifted,base,1.0,qg);}"


def _replace_function(wrapper: str, function_marker: str, replacement: str) -> str:
    start=wrapper.find(function_marker)
    if start<0:
        raise SystemExit("release wrapper: function marker not found")
    depth=0
    in_string=False
    escape=False
    i=start
    end=None
    while i<len(wrapper):
        ch=wrapper[i]
        if in_string:
            if escape:
                escape=False
            elif ch=="\\":
                escape=True
            elif ch=='"':
                in_string=False
        else:
            if ch=='"':
                in_string=True
            elif ch=='{':
                depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:
                    end=i+1
                    break
        i+=1
    if end is None:
        raise SystemExit("release wrapper: function closing brace not found")
    return wrapper[:start]+replacement+wrapper[end:]


def patch_release_guards() -> None:
    _ORIGINAL_FAST_PATCH()
    if _ORIGINAL_CONFLICT not in build_candidate.WRAPPER:
        raise SystemExit("release wrapper: expected binary predicate guard marker not found")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(_ORIGINAL_CONFLICT,_GENERIC_CONFLICT,1)

    safe_eq_hits=build_candidate.WRAPPER.count(_OLD_SAFE_EQ)
    if safe_eq_hits!=1:
        raise SystemExit(f"release wrapper: expected one numeric-equivalence expression, found {safe_eq_hits}")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(_OLD_SAFE_EQ,_NEW_SAFE_EQ,1)

    lift_hits=build_candidate.WRAPPER.count(_OLD_LIFT)
    if lift_hits!=1:
        raise SystemExit(f"release wrapper: expected one numeric-equivalence lift, found {lift_hits}")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(_OLD_LIFT,_NEW_LIFT,1)

    build_candidate.WRAPPER=_replace_function(
        build_candidate.WRAPPER,
        "fn vr_safe_pow(score:f32)->f32{",
        _MILD_CALIBRATION,
    )


if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch_release_guards
    build_candidate_fast.main()
