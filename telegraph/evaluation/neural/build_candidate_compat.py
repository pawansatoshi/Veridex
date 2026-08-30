#!/usr/bin/env python3
"""Compatibility entry point for the pinned baseline build."""
from __future__ import annotations
import sys
import build_candidate

OLD_RANGE = "(start, start + VR_SCRATCH.len())"
NEW_RANGE = "(start, start + (VR_SCRATCH_SLOT * VR_SCRATCH_SLOTS))"
OLD_GUARD = """fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}}}g}"""
NEW_GUARD = r'''fn vr_binary_fragment(ans:&[u8])->bool{if vr_first_binary_polarity(ans).is_none(){return false;}let mut words=0usize;let mut i=0usize;while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}if s>=i{continue;}words+=1;if words>3{return false;}}words<=3&&(vr_has_word(ans,b"it")||vr_has_word(ans,b"this")||vr_has_word(ans,b"that")||vr_has_word(ans,b"they"))}
fn vr_predicate_polarity(text:&[u8])->Option<bool>{const POS:&[&[u8]]=&[b"secure",b"safe",b"protected",b"uncompromised",b"clean",b"benign",b"legitimate",b"trusted",b"authorized",b"authorised",b"approved",b"allowed",b"permitted",b"valid",b"correct",b"active",b"enabled",b"healthy",b"intact",b"solvent",b"genuine",b"authentic"];const NEG:&[&[u8]]=&[b"compromised",b"unsafe",b"vulnerable",b"malicious",b"fraud",b"fraudulent",b"scam",b"dangerous",b"harmful",b"hacked",b"breached",b"phishing",b"unauthorized",b"unauthorised",b"rejected",b"denied",b"blocked",b"forbidden",b"invalid",b"incorrect",b"inactive",b"disabled",b"unhealthy",b"insolvent",b"fake",b"counterfeit"];let p=vr_has_any(text,POS);let n=vr_has_any(text,NEG);match(p,n){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}}
fn vr_question_predicate_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{if !vr_question_is_binary(q){return false;}match(vr_predicate_polarity(gt),vr_predicate_polarity(ans)){(Some(g),Some(a))=>g!=a,_=>false}}
fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}if vr_binary_fragment(ans){g*=0.35;}}if vr_question_predicate_conflict(q,gt,ans){g*=0.06;}}g}'''
OLD_ENTITY_LINE = "if !word[0].is_ascii_uppercase() || word.len()<3 || vr_is_ignored_entity(word){continue;}"
NEW_ENTITY_LINE = "let titlecase=word[0].is_ascii_uppercase()&&word[1..].iter().any(|b|b.is_ascii_lowercase());if !titlecase||word.len()<3||vr_is_ignored_entity(word){continue;}"
OLD_SCORE = """unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}"""
NEW_SCORE = """fn vr_normalize_baseline_surface(input:&[u8])->alloc::vec::Vec<u8>{let mut out=alloc::vec::Vec::with_capacity(input.len());for &b in input{if b.is_ascii_uppercase(){out.push(b+32);}else if b.is_ascii_alphanumeric()||!b.is_ascii(){out.push(b);}else if matches!(b,b'$'|b'%'|b','|b'.'|b'-'|b'/'){out.push(b);}else{out.push(b' ');}}out}
unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}"""
OLD_BASE = """let mut base=rank_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);if !base.is_finite(){return(0.0,0.0,0.0,0.0);}"""
CACHE_HELPERS = r'''
const VR_CACHE_SLOTS: usize = 16;
const VR_EMBED_DIM: usize = 384;
static mut VR_Q_CACHE: [[f32; VR_EMBED_DIM]; VR_CACHE_SLOTS] = [[0.0; VR_EMBED_DIM]; VR_CACHE_SLOTS];
static mut VR_GT_CACHE: [[f32; VR_EMBED_DIM]; VR_CACHE_SLOTS] = [[0.0; VR_EMBED_DIM]; VR_CACHE_SLOTS];
static mut VR_Q_HASH: [u64; VR_CACHE_SLOTS] = [0; VR_CACHE_SLOTS];
static mut VR_GT_HASH: [u64; VR_CACHE_SLOTS] = [0; VR_CACHE_SLOTS];
static mut VR_Q_LEN: [usize; VR_CACHE_SLOTS] = [0; VR_CACHE_SLOTS];
static mut VR_GT_LEN: [usize; VR_CACHE_SLOTS] = [0; VR_CACHE_SLOTS];
static mut VR_CACHE_VALID: [bool; VR_CACHE_SLOTS] = [false; VR_CACHE_SLOTS];
static mut VR_CACHE_NEXT: usize = 0;
#[inline] fn vr_hash(bytes:&[u8])->u64{let mut h=0xcbf29ce484222325u64;for &b in bytes{h^=b as u64;h=h.wrapping_mul(0x100000001b3u64);}h}
unsafe fn vr_cached_base(q:&[u8],gt:&[u8],ans:&[u8])->f32{let qh=vr_hash(q);let gh=vr_hash(gt);let mut slot=0usize;let mut hit=false;let vp=core::ptr::addr_of!(VR_CACHE_VALID) as *const bool;let qp=core::ptr::addr_of!(VR_Q_HASH) as *const u64;let gp=core::ptr::addr_of!(VR_GT_HASH) as *const u64;let qlp=core::ptr::addr_of!(VR_Q_LEN) as *const usize;let glp=core::ptr::addr_of!(VR_GT_LEN) as *const usize;for i in 0..VR_CACHE_SLOTS{if *vp.add(i)&&*qp.add(i)==qh&&*gp.add(i)==gh&&*qlp.add(i)==q.len()&&*glp.add(i)==gt.len(){slot=i;hit=true;break;}}if !hit{let np=core::ptr::addr_of_mut!(VR_CACHE_NEXT);slot=*np%VR_CACHE_SLOTS;*np=(*np).wrapping_add(1);let qe=embed(q.as_ptr() as i32,q.len() as i32) as *const f32;let ge=embed(gt.as_ptr() as i32,gt.len() as i32) as *const f32;let qd=(core::ptr::addr_of_mut!(VR_Q_CACHE) as *mut f32).add(slot*VR_EMBED_DIM);let gd=(core::ptr::addr_of_mut!(VR_GT_CACHE) as *mut f32).add(slot*VR_EMBED_DIM);core::ptr::copy_nonoverlapping(qe,qd,VR_EMBED_DIM);core::ptr::copy_nonoverlapping(ge,gd,VR_EMBED_DIM);*(core::ptr::addr_of_mut!(VR_Q_HASH) as *mut u64).add(slot)=qh;*(core::ptr::addr_of_mut!(VR_GT_HASH) as *mut u64).add(slot)=gh;*(core::ptr::addr_of_mut!(VR_Q_LEN) as *mut usize).add(slot)=q.len();*(core::ptr::addr_of_mut!(VR_GT_LEN) as *mut usize).add(slot)=gt.len();*(core::ptr::addr_of_mut!(VR_CACHE_VALID) as *mut bool).add(slot)=true;}let qvec=(core::ptr::addr_of!(VR_Q_CACHE) as *const f32).add(slot*VR_EMBED_DIM) as i32;let gtvec=(core::ptr::addr_of!(VR_GT_CACHE) as *const f32).add(slot*VR_EMBED_DIM) as i32;rank_answer_cached(qvec,gtvec,gt.as_ptr() as i32,gt.len() as i32,ans.as_ptr() as i32,ans.len() as i32)}
'''
CACHE_NEW = """let q_base=vr_normalize_baseline_surface(q.as_bytes());let gt_base=vr_normalize_baseline_surface(gt.as_bytes());let a_base=vr_normalize_baseline_surface(a.as_bytes());
    let mut base=vr_cached_base(&q_base,&gt_base,&a_base);if !base.is_finite(){return(0.0,0.0,0.0,0.0);}"""

for needle,name in ((OLD_RANGE,"scratch-range expression"),(OLD_GUARD,"question-guard expression"),(OLD_ENTITY_LINE,"entity-conflict line"),(OLD_SCORE,"score function prologue"),(OLD_BASE,"baseline scoring call")):
    if needle not in build_candidate.WRAPPER: raise SystemExit(f"expected {name} not found; baseline wrapper changed")
patched=build_candidate.WRAPPER.replace(OLD_RANGE,NEW_RANGE,1).replace(OLD_GUARD,NEW_GUARD,1).replace(OLD_ENTITY_LINE,NEW_ENTITY_LINE,1).replace(OLD_SCORE,NEW_SCORE,1).replace(OLD_BASE,CACHE_NEW,1)
patched=patched.replace("\nunsafe fn veridex_score", "\n"+CACHE_HELPERS+"\nunsafe fn veridex_score",1)
build_candidate.WRAPPER=patched

if __name__ == "__main__":
    sys.argv[0]="build_candidate.py"
    build_candidate.main()
