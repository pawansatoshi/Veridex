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

# Champion-style smoothstep sharpening. It is strictly monotone on [0,1],
# preserves endpoints, and pushes middling correct scores toward 1 without
# changing their ordinal order.
_MONOTONIC_SHARPEN = "fn vr_safe_pow(score:f32)->f32{if !score.is_finite(){return 0.0;}if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let t=score.clamp(0.0,1.0);let y=t+t*t*(3.0-2.0*t)*(1.0-t);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"

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

_NEGATION_HELPERS = r'''fn vr_has_trailing_word(text:&[u8],needle:&[u8])->bool{
    let mut i=text.len();
    while i>0 && !text[i-1].is_ascii_alphanumeric(){i-=1;}
    let end=i;
    while i>0 && text[i-1].is_ascii_alphanumeric(){i-=1;}
    i<end && vr_word_eq(text,i,end,needle)
}
fn vr_explicit_negation_conflict(gt:&[u8],ans:&[u8])->bool{
    if vr_has_trailing_word(ans,b"not") && !vr_has_word(gt,b"not"){return true;}
    let ans_has_not=vr_has_word(ans,b"not")||vr_has_word(ans,b"never");
    if !ans_has_not || vr_has_word(gt,b"not") || vr_has_word(gt,b"never"){return false;}
    match vr_first_binary_polarity(ans){
        Some(_)=>true,
        None=>false
    }
}'''

_NEW_QUESTION_GUARD = r'''fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let mut g=1.0f32;
    if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}
    if vr_question_is_binary(q){
        if let Some(p)=vr_first_binary_polarity(gt){
            match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}
        }
        // Apply the generic predicate model even when neither side is a literal
        // yes/no token (e.g. compromised vs secure, approved vs rejected).
        if vr_question_predicate_conflict(q,gt,ans){g*=0.06;}
        if vr_binary_fragment(ans){g*=0.20;}
    }
    if vr_explicit_negation_conflict(gt,ans){g*=0.05;}
    g
}'''


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
    if _ORIGINAL_CONFLICT in build_candidate.WRAPPER:
        build_candidate.WRAPPER=build_candidate.WRAPPER.replace(_ORIGINAL_CONFLICT,_GENERIC_CONFLICT,1)
    elif "fn vr_question_predicate_conflict(" not in build_candidate.WRAPPER:
        raise SystemExit("release wrapper: predicate conflict helper unavailable")

    safe_eq_hits=build_candidate.WRAPPER.count(_OLD_SAFE_EQ)
    if safe_eq_hits!=1:
        raise SystemExit(f"release wrapper: expected one numeric-equivalence expression, found {safe_eq_hits}")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(_OLD_SAFE_EQ,_NEW_SAFE_EQ,1)

    lift_hits=build_candidate.WRAPPER.count(_OLD_LIFT)
    if lift_hits!=1:
        raise SystemExit(f"release wrapper: expected one numeric-equivalence lift, found {lift_hits}")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(_OLD_LIFT,_NEW_LIFT,1)

    marker="fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8]) -> f32{"
    marker_compact="fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{"
    marker = marker if marker in build_candidate.WRAPPER else marker_compact
    replacement=_NEGATION_HELPERS+"\n"+_NEW_QUESTION_GUARD
    build_candidate.WRAPPER=_replace_function(build_candidate.WRAPPER,marker,replacement)

    build_candidate.WRAPPER=_replace_function(
        build_candidate.WRAPPER,
        "fn vr_safe_pow(score:f32)->f32{",
        _MONOTONIC_SHARPEN,
    )


if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch_release_guards
    build_candidate_fast.main()
