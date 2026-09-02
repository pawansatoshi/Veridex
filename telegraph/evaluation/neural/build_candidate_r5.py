#!/usr/bin/env python3
"""Build the final Track-2 semantic R5 candidate.

This release deliberately bypasses the retired logistic-calibration wrapper.
It starts from the proven fast neural path, uses the official baseline's four
signal breakdown to make the score question-aware, then applies only
high-confidence factual contradiction caps. The historical 14.0 monotone
calibration is retained as the final bounded transform.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast

_BASE_PATCH = build_candidate_fast.patch_semantic_guards

_R5_COMMON_CAP = r'''fn vr_r5_common_cap(w:&[u8])->bool{matches!(w,
 b"Answer"|b"According"|b"Provided"|b"Information"|b"Based"|b"Result"|b"Response"|b"Note"|b"For"|b"From"|b"The"|b"This"|b"That"|b"These"|b"Those"|b"It"|b"Its"|b"Yes"|b"No")}
'''

_R5_ENTITY = r'''fn vr_r5_entity_anchor(text:&[u8])->bool{
    let mut i=0usize;
    while i<text.len(){
        while i<text.len()&&!text[i].is_ascii_alphabetic(){i+=1;}
        let s=i;while i<text.len()&&text[i].is_ascii_alphabetic(){i+=1;}
        if s>=i{continue;}
        let w=&text[s..i];
        let titlecase=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());
        let allcaps=w.len()>=3&&w.iter().all(|b|b.is_ascii_uppercase());
        if (titlecase||allcaps)&&!vr_is_ignored_entity(w)&&!vr_r5_common_cap(w){return true;}
    }
    false
}
fn vr_r5_entity_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_r5_entity_anchor(gt){return false;}
    let mut i=0usize;
    while i<ans.len(){
        while i<ans.len()&&!ans[i].is_ascii_alphabetic(){i+=1;}
        let s=i;while i<ans.len()&&ans[i].is_ascii_alphabetic(){i+=1;}
        if s>=i{continue;}
        let w=&ans[s..i];
        let titlecase=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());
        let allcaps=w.len()>=3&&w.iter().all(|b|b.is_ascii_uppercase());
        if (titlecase||allcaps)&&!vr_is_ignored_entity(w)&&!vr_r5_common_cap(w)&&!vr_has_word(q,w)&&!vr_has_word(gt,w){return true;}
    }
    false
}'''

_R5_NEGATION = r'''fn vr_r5_negation_conflict(gt:&[u8],ans:&[u8])->bool{
    let gt_not=vr_has_word(gt,b"not")||vr_has_word(gt,b"never");
    let ans_not=vr_has_word(ans,b"not")||vr_has_word(ans,b"never");
    ans_not&&!gt_not
}'''

_R5_TAIL = r'''fn vr_r5_tail_contamination(ans:&[u8])->bool{
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

_R5_NORMALIZE = r'''fn vr_r5_normalized_equal(gt:&[u8],ans:&[u8])->bool{
    let mut gi=0usize;let mut ai=0usize;let mut gb=[0u8;64];let mut ab=[0u8;64];let mut gn=0usize;let mut an=0usize;
    while gi<gt.len(){if gt[gi].is_ascii_alphanumeric(){if gn>=64{return false;}gb[gn]=vr_lower(gt[gi]);gn+=1;}gi+=1;}
    while ai<ans.len(){if ans[ai].is_ascii_alphanumeric(){if an>=64{return false;}ab[an]=vr_lower(ans[ai]);an+=1;}ai+=1;}
    gn>0&&gn==an&&gb[..gn]==ab[..an]
}'''

_R5_QUESTION_GUARD = r'''fn vr_r5_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let mut g=1.0f32;
    if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.92;}
    if vr_question_is_binary(q){
        if let Some(p)=vr_first_binary_polarity(gt){
            if let Some(a)=vr_first_binary_polarity(ans){if a!=p{g*=0.90;}}
        }
    }
    g
}'''

_R5_SCORE = r'''unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}
    let gb=gt.as_bytes();let ab=a.as_bytes();let qb=q.as_bytes();
    if vr_r5_normalized_equal(gb,ab){return(1.0,1.0,1.0,1.0);}

    let bp=breakdown_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);
    if bp==0{return(0.0,0.0,0.0,0.0);}
    let sig=core::slice::from_raw_parts(bp as *const f32,5);
    let relevance=sig[0].clamp(0.0,1.0);
    let correctness=sig[1].clamp(0.0,1.0);
    let lexical=sig[2].clamp(0.0,1.0);
    let length=sig[3].clamp(0.0,1.0);
    let baseline=sig[4].clamp(0.0,1.0);
    if !relevance.is_finite()||!correctness.is_finite()||!lexical.is_finite()||!length.is_finite()||!baseline.is_finite(){return(0.0,baseline,1.0,1.0);}

    // Reweight the official baseline signals toward answer correctness and
    // question relevance. Length remains only a tiny supporting signal so
    // verbosity cannot substitute for factual similarity.
    let semantic=0.52*correctness+0.30*relevance+0.13*lexical+0.05*length;
    let mut score=(0.80*semantic+0.20*baseline).clamp(0.0,1.0);

    let opposite=vr_opposite(gb,ab);
    let entity_conflict=vr_r5_entity_conflict(qb,gb,ab);
    let numeric_equiv=vr_numeric_context(qb)&&match(vr_first_number(gb),vr_first_number(ab)){
        (Some((g,gp)),Some((a,ap)))=>gp==ap&&(g-a).abs()<=g.abs().max(a.abs()).max(1.0)*1e-9&&!opposite&&!entity_conflict,
        _=>false
    };
    let numeric_mismatch=vr_numeric_context(qb)&&match(vr_first_number(gb),vr_first_number(ab)){
        (Some(_),Some(_))=>!numeric_equiv,
        _=>false
    };
    let binary_conflict=vr_question_is_binary(qb)&&match(vr_first_binary_polarity(gb),vr_first_binary_polarity(ab)){
        (Some(g),Some(a))=>g!=a,
        _=>false
    };
    let negation=vr_r5_negation_conflict(gb,ab);
    let tail=vr_r5_tail_contamination(ab);

    let g=vr_r5_question_guard(qb,gb,ab);
    score=(score*g).clamp(0.0,1.0);

    // Only high-confidence contradictions receive hard caps. This preserves
    // semantic ranking for uncertain/partial answers instead of collapsing
    // both good and bad answers toward zero.
    if opposite{score=score.min(0.08);}
    if entity_conflict{score=score.min(0.10);}
    if numeric_mismatch{score=score.min(0.15);}
    if binary_conflict{score=score.min(0.10);}
    if negation||tail{score=score.min(0.12);}
    if numeric_equiv{score=score.max(0.92);}

    let final_score=vr_r5_safe_pow(score);
    (final_score,baseline,1.0,g)
}'''

_R5_CALIBRATION = r'''fn vr_r5_safe_pow(score:f32)->f32{
    if !score.is_finite(){return 0.0;}
    if score<=0.0{return 0.0;}
    if score>=1.0{return 1.0;}
    let t=score.clamp(0.0,1.0);
    let y=t+0.9*t*(1.0-t)*(2.0*t-1.0);
    if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}
}'''


def replace_function(wrapper: str, marker: str, replacement: str) -> str:
    start=wrapper.find(marker)
    if start<0:
        raise SystemExit(f"r5 builder: missing function marker: {marker}")
    depth=0;quote=False;escape=False;i=start
    while i<len(wrapper):
        ch=wrapper[i]
        if quote:
            if escape: escape=False
            elif ch=='\\': escape=True
            elif ch=='"': quote=False
        else:
            if ch=='"': quote=True
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:return wrapper[:start]+replacement+wrapper[i+1:]
        i+=1
    raise SystemExit(f"r5 builder: unterminated function: {marker}")


def patch()->None:
    _BASE_PATCH()
    b=build_candidate.WRAPPER
    b=_R5_COMMON_CAP+"\n"+b
    b=_R5_ENTITY+"\n"+b
    b=_R5_NEGATION+"\n"+b
    b=_R5_TAIL+"\n"+b
    b=_R5_NORMALIZE+"\n"+b
    b=_R5_QUESTION_GUARD+"\n"+b
    b=_replace_wrapper_fallback(b)
    build_candidate.WRAPPER=b


def _replace_wrapper_fallback(b:str)->str:
    # Replace the fast builder's complete scorer, guard and calibration with
    # the R5 versions. The helper functions remain available for compatibility
    # and are harmlessly dead when superseded here.
    b=replace_function(b,"unsafe fn veridex_score(",_R5_SCORE)
    b=_R5_CALIBRATION+"\n"+b
    # The fast builder does not depend on our helper names below after scorer
    # replacement; retain its exported ABI and all baseline runtime machinery.
    return b


if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch
    build_candidate_fast.main()
