#!/usr/bin/env python3
"""Compatibility entry point for the pinned baseline build."""
from __future__ import annotations
import sys
import build_candidate

OLD_RANGE = "(start, start + VR_SCRATCH.len())"
NEW_RANGE = "(start, start + (VR_SCRATCH_SLOT * VR_SCRATCH_SLOTS))"

OLD_GUARD = """fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}}}g}"""
NEW_GUARD = """fn vr_binary_fragment(ans:&[u8])->bool{if vr_first_binary_polarity(ans).is_none(){return false;}let mut words=0usize;let mut i=0usize;while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}if s>=i{continue;}words+=1;if words>3{return false;}}words<=3&&(vr_has_word(ans,b\"it\")||vr_has_word(ans,b\"this\")||vr_has_word(ans,b\"that\")||vr_has_word(ans,b\"they\"))}
fn vr_question_predicate_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_question_is_binary(q){return false;}
    let gp=match vr_first_binary_polarity(gt){Some(v)=>v,None=>return false};
    let negative_q=vr_has_any(q,&[b\"denied\",b\"rejected\",b\"blocked\",b\"forbidden\",b\"unauthorized\",b\"unauthorised\",b\"unsafe\",b\"fraudulent\",b\"dangerous\"]);
    let positive_q=vr_has_any(q,&[b\"approved\",b\"authorized\",b\"authorised\",b\"allowed\",b\"permitted\",b\"safe\",b\"benign\",b\"legitimate\",b\"trusted\"]);
    let negative_a=vr_has_any(ans,&[b\"denied\",b\"rejected\",b\"blocked\",b\"forbidden\",b\"unauthorized\",b\"unauthorised\",b\"unsafe\",b\"fraudulent\",b\"dangerous\"]);
    let positive_a=vr_has_any(ans,&[b\"approved\",b\"authorized\",b\"authorised\",b\"allowed\",b\"permitted\",b\"safe\",b\"benign\",b\"legitimate\",b\"trusted\"]);
    if negative_q && ((gp && positive_a)||(!gp && negative_a)){return true;}
    if positive_q && ((gp && negative_a)||(!gp && positive_a)){return true;}
    false
}
fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}if vr_binary_fragment(ans){g*=0.35;}if vr_question_predicate_conflict(q,gt,ans){g*=0.06;}}}g}"""

OLD_ENTITY_LINE = "if !word[0].is_ascii_uppercase() || word.len()<3 || vr_is_ignored_entity(word){continue;}"
NEW_ENTITY_LINE = "let titlecase=word[0].is_ascii_uppercase()&&word[1..].iter().any(|b|b.is_ascii_lowercase());if !titlecase||word.len()<3||vr_is_ignored_entity(word){continue;}"

OLD_SCORE = """unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}"""
NEW_SCORE = """fn vr_normalize_baseline_surface(input:&[u8])->alloc::vec::Vec<u8>{
    let mut out=alloc::vec::Vec::with_capacity(input.len());
    for &b in input{
        if b.is_ascii_uppercase(){out.push(b+32);}
        else if b.is_ascii_alphanumeric()||!b.is_ascii(){out.push(b);}
        else if matches!(b,b'$'|b'%'|b','|b'.'|b'-'|b'/'){out.push(b);}
        else{out.push(b' ');}
    }
    out
}

unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}"""
OLD_BASE = """let mut base=rank_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);if !base.is_finite(){return(0.0,0.0,0.0,0.0);}"""
NEW_BASE = """let q_base=vr_normalize_baseline_surface(q.as_bytes());let gt_base=vr_normalize_baseline_surface(gt.as_bytes());let a_base=vr_normalize_baseline_surface(a.as_bytes());
    let mut base=rank_answer_base(q_base.as_ptr() as i32,q_base.len() as i32,gt_base.as_ptr() as i32,gt_base.len() as i32,a_base.as_ptr() as i32,a_base.len() as i32);if !base.is_finite(){return(0.0,0.0,0.0,0.0);}"""

for needle,name in ((OLD_RANGE,"scratch-range expression"),(OLD_GUARD,"question-guard expression"),(OLD_ENTITY_LINE,"entity-conflict line"),(OLD_SCORE,"score function prologue"),(OLD_BASE,"baseline scoring call")):
    if needle not in build_candidate.WRAPPER:
        raise SystemExit(f"expected {name} not found; baseline wrapper changed")

patched=build_candidate.WRAPPER.replace(OLD_RANGE,NEW_RANGE,1)
patched=patched.replace(OLD_GUARD,NEW_GUARD,1)
patched=patched.replace(OLD_ENTITY_LINE,NEW_ENTITY_LINE,1)
patched=patched.replace(OLD_SCORE,NEW_SCORE,1)
patched=patched.replace(OLD_BASE,NEW_BASE,1)
build_candidate.WRAPPER=patched

if __name__ == "__main__":
    sys.argv[0]="build_candidate.py"
    build_candidate.main()
