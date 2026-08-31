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

_VR_NORMALIZE = r'''fn vr_normalize_baseline_surface(input:&[u8])->alloc::vec::Vec<u8>{let mut out=alloc::vec::Vec::with_capacity(input.len());for &b in input{if b.is_ascii_uppercase(){out.push(b+32);}else if b.is_ascii_alphanumeric()||!b.is_ascii(){out.push(b);}else if matches!(b,b'$'|b'%'|b','|b'.'|b'-'|b'/'){out.push(b);}else{out.push(b' ');}}out}'''

_VR_CACHE_HELPERS = r'''
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

_VR_NUMERIC = r'''fn vr_safe_numeric_equiv(gt:&[u8],ans:&[u8])->bool{match(vr_first_number(gt),vr_first_number(ans)){(Some((g,gp)),Some((a,ap)))=>{if gp!=ap{return false;}let scale=g.abs().max(a.abs()).max(1.0);(g-a).abs()<=scale*1e-9},_=>false}}
fn vr_numeric_context(q:&[u8])->bool{const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity"];vr_has_any(q,TERMS)}
'''

def _replace_safe_pow(wrapper: str) -> str:
    start = wrapper.find("fn vr_safe_pow(score:f32)->f32{")
    if start < 0:
        raise SystemExit("release wrapper: vr_safe_pow function not found")
    end = wrapper.find("\nunsafe fn veridex_score", start)
    if end < 0:
        raise SystemExit("release wrapper: veridex_score boundary not found")
    return wrapper[:start] + _ODDS_SHARPEN + wrapper[end:]


def _repair_missing_helpers(wrapper: str) -> str:
    marker = "unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){"
    if marker not in wrapper:
        raise SystemExit("release wrapper: veridex_score boundary not found")
    helpers = ""
    if "fn vr_normalize_baseline_surface(" not in wrapper:
        helpers += _VR_NORMALIZE + "\n"
    if "fn vr_cached_base(" not in wrapper:
        helpers += _VR_CACHE_HELPERS + "\n"
    if "fn vr_safe_numeric_equiv(" not in wrapper:
        helpers += _VR_NUMERIC + "\n"
    if helpers:
        wrapper = wrapper.replace(marker, helpers + marker, 1)
    required = ("fn vr_normalize_baseline_surface(", "fn vr_cached_base(", "fn vr_safe_numeric_equiv(", "fn vr_numeric_context(")
    missing = [name for name in required if name not in wrapper]
    if missing:
        raise SystemExit("release wrapper: helper repair incomplete: " + ", ".join(missing))
    return wrapper


def patch_release_guards() -> None:
    _ORIGINAL_FAST_PATCH()
    if _ORIGINAL_CONFLICT not in build_candidate.WRAPPER:
        raise SystemExit("release wrapper: expected binary predicate guard marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(_ORIGINAL_CONFLICT, _GENERIC_CONFLICT, 1)
    build_candidate.WRAPPER = _repair_missing_helpers(build_candidate.WRAPPER)
    build_candidate.WRAPPER = _replace_safe_pow(build_candidate.WRAPPER)


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch_release_guards
    build_candidate_fast.main()
