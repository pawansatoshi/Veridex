#!/usr/bin/env python3
"""Track-2 final release builder: lean factual-integrity path.

Keep the real MiniLM fast scorer as the primary signal and retain the vetted
release contradiction/polarity/entity/numeric guards. Add a small release
integrity guard at the exported scoring boundary so explicit trailing negation
and unrelated-tail contamination cannot be hidden by neural similarity.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release as base


def _replace_function(src: str, marker: str, replacement: str) -> str:
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"v3 patch: function marker not found: {marker}")
    brace = src.find("{", start)
    if brace < 0:
        raise RuntimeError(f"v3 patch: opening brace not found: {marker}")
    depth = 0
    quote = None
    escaped = False
    i = brace
    while i < len(src):
        ch = src[i]
        if quote is not None:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
        else:
            if ch == '"':
                quote = '"'
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return src[:start] + replacement + src[i + 1:]
        i += 1
    raise RuntimeError(f"v3 patch: unmatched braces: {marker}")


_RELEASE_TAIL = r'''fn vr_release_tail_contamination(ans:&[u8])->bool{
    let mut i=0usize;let mut last_start=0usize;let mut last_end=0usize;
    while i<ans.len(){
        while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}
        if i>=ans.len(){break;}
        let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}
        last_start=s;last_end=i;
    }
    if last_start>=last_end{return false;}
    if vr_word_eq(ans,last_start,last_end,b"not")||vr_word_eq(ans,last_start,last_end,b"never"){return true;}
    vr_has_word(ans,b"unrelated")&&(vr_has_word(ans,b"background")||vr_has_word(ans,b"another")||vr_has_word(ans,b"topic")||vr_has_word(ans,b"entity"))
}'''


_RELEASE_GUARD = r'''fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let mut g=1.0f32;
    let entity_conflict=vr_release_entity_conflict(q,gt,ans);
    if entity_conflict{g*=0.02;}
    let numeric_equiv=vr_release_numeric_equivalent(q,gt,ans);
    if numeric_equiv&&!entity_conflict{g=1.0;} else if vr_numeric_context(q){
        match(vr_first_number(gt),vr_first_number(ans)){
            (Some(_),Some(_))=>g*=0.05,
            (Some(_),None)=>g*=0.65,
            _=>{}
        }
    }
    if vr_question_is_binary(q){
        if let Some(p)=vr_first_binary_polarity(gt){
            match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}
        }
        if vr_question_predicate_conflict(q,gt,ans){g*=0.06;}
        if vr_release_binary_fragment(ans){g*=0.20;}
    }
    if vr_release_negation_conflict(gt,ans){g*=0.05;}
    if vr_release_tail_contamination(ans){g*=0.05;}
    g
}'''


_RANK_ANSWER = r'''#[no_mangle]
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


def patch() -> None:
    # Keep the authoritative release guard stack from build_candidate_fast_release.
    # Then enforce the live-risk tail-integrity and generalized predicate rules
    # directly at the exported scoring boundary.
    base.patch_release_guards()
    w = build_candidate.WRAPPER
    if "fn vr_release_tail_contamination(" not in w:
        p = w.find("fn vr_question_guard(")
        if p < 0:
            raise RuntimeError("v3 patch: question guard marker not found")
        w = w[:p] + _RELEASE_TAIL + "\n" + w[p:]
    w = _replace_function(w, "fn vr_question_guard(", _RELEASE_GUARD)
    w = _replace_function(w, "pub unsafe extern \"C\" fn rank_answer(", _RANK_ANSWER)
    if "direct_predicate_conflict" not in w:
        raise RuntimeError("v3 patch: exported predicate guard was not wired")
    build_candidate.WRAPPER = w


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
