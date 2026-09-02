#!/usr/bin/env python3
"""Final Track-2 release builder for the 14.0-derived semantic line.

This builder is deliberately isolated from build_candidate_compat's historical
import-time mutations. It starts with the pinned official MiniLM/BM25 baseline,
keeps the proven 64-token/5-layer fast path, then adds only high-confidence
factual protections. The historical 14.0 monotone calibration is retained;
there is no logistic/pow1.18 compression.
"""
from __future__ import annotations

import sys
import types

# build_candidate_fast historically imports build_candidate_compat, whose module
# body mutates build_candidate.WRAPPER at import time. That is unsafe for a final
# release builder. Install a no-op compatibility module before importing fast so
# the clean build_candidate.WRAPPER remains authoritative.
sys.modules.setdefault("build_candidate_compat", types.ModuleType("build_candidate_compat"))

import build_candidate
import build_candidate_fast

_BASE_PATCH = build_candidate_fast.patch_semantic_guards

_R5_HELPERS = r'''fn vr_r5_normalized_equal(gt:&[u8],ans:&[u8])->bool{
    let mut g=alloc::vec::Vec::new();let mut a=alloc::vec::Vec::new();
    for &b in gt{if b.is_ascii_alphanumeric(){g.push(vr_lower(b));}}
    for &b in ans{if b.is_ascii_alphanumeric(){a.push(vr_lower(b));}}
    !g.is_empty()&&g==a
}
fn vr_r5_numeric_context(q:&[u8])->bool{
    const T:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity",b"many",b"much"];
    vr_has_any(q,T)
}
fn vr_r5_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize;
    while i<text.len(){
        if text[i].is_ascii_digit(){
            let prev=if i>0{vr_lower(text[i-1])}else{0};
            if prev==b'q'&&i+1<text.len()&&matches!(text[i+1],b'1'|b'2'|b'3'|b'4'){i+=2;continue;}
            break;
        }
        i+=1;
    }
    if i>=text.len(){return None;}
    let mut x=0.0f64;let mut frac=0.1f64;let mut dot=false;let mut any=false;
    while i<text.len(){
        let c=text[i];
        if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}
        else if c==b','||c==b'_'{i+=1;}
        else if c==b'.'&&!dot&&i+1<text.len()&&text[i+1].is_ascii_digit(){dot=true;i+=1;}
        else{break;}
    }
    if !any{return None;}
    while i<text.len()&&vr_ws(text[i]){i+=1;}
    let mut scale=1.0f64;
    if i<text.len(){match vr_lower(text[i]){b'k'=>scale=1e3,b'm'=>scale=1e6,b'b'=>scale=1e9,_=>{}}}
    if scale==1.0{
        if vr_has_word(text,b"thousand"){scale=1e3}
        else if vr_has_word(text,b"million"){scale=1e6}
        else if vr_has_word(text,b"billion"){scale=1e9}
    }
    x*=scale;
    Some((x,vr_has_word(text,b"percent")||vr_has_word(text,b"percentage")||text[i..].first()==Some(&b'%')))
}
fn vr_r5_polarity(text:&[u8])->Option<bool>{
    const POS:&[&[u8]]=&[b"safe",b"secure",b"benign",b"legitimate",b"genuine",b"authentic",b"trusted",b"trustworthy",b"harmless",b"authorized",b"authorised",b"approved",b"allowed",b"permitted",b"confirmed",b"valid",b"correct",b"active",b"enabled",b"healthy",b"intact"];
    const NEG:&[&[u8]]=&[b"scam",b"fraud",b"fraudulent",b"malicious",b"dangerous",b"harmful",b"unsafe",b"vulnerable",b"hacked",b"breached",b"phishing",b"fake",b"counterfeit",b"compromised",b"unauthorized",b"unauthorised",b"rejected",b"denied",b"blocked",b"forbidden",b"invalid",b"incorrect",b"inactive",b"disabled",b"unhealthy"];
    let p=vr_has_any(text,POS);let n=vr_has_any(text,NEG);
    match(p,n){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}
}
fn vr_r5_polarity_conflict(gt:&[u8],ans:&[u8])->bool{
    match(vr_r5_polarity(gt),vr_r5_polarity(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}
fn vr_r5_entity_anchor(text:&[u8])->bool{
    let mut i=0usize;
    while i<text.len(){
        while i<text.len()&&!text[i].is_ascii_alphabetic(){i+=1;}
        let s=i;while i<text.len()&&text[i].is_ascii_alphabetic(){i+=1;}
        if s>=i{continue;}
        let w=&text[s..i];
        let titlecase=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());
        let allcaps=w.len()>=3&&w.iter().all(|b|b.is_ascii_uppercase());
        if (titlecase||allcaps)&&!vr_is_ignored_entity(w){return true;}
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
        if (titlecase||allcaps)&&!vr_is_ignored_entity(w)&&!vr_has_word(q,w)&&!vr_has_word(gt,w){return true;}
    }
    false
}
fn vr_r5_negation_conflict(gt:&[u8],ans:&[u8])->bool{
    (vr_has_word(ans,b"not")||vr_has_word(ans,b"never"))&&!(vr_has_word(gt,b"not")||vr_has_word(gt,b"never"))
}
fn vr_r5_tail_bad(ans:&[u8])->bool{
    vr_has_word(ans,b"unrelated")&&(vr_has_word(ans,b"background")||vr_has_word(ans,b"another")||vr_has_word(ans,b"topic")||vr_has_word(ans,b"entity"))
}
fn vr_r5_numeric_equal(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_r5_numeric_context(q){return false;}
    match(vr_r5_number(gt),vr_r5_number(ans)){
        (Some((g,gp)),Some((a,ap)))=>gp==ap&&(g-a).abs()<=g.abs().max(a.abs()).max(1.0)*1e-9,
        _=>false
    }
}
fn vr_r5_numeric_mismatch(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_r5_numeric_context(q){return false;}
    match(vr_r5_number(gt),vr_r5_number(ans)){
        (Some(_),Some(_))=>!vr_r5_numeric_equal(q,gt,ans),
        (Some(_),None)=>true,
        (None,Some(_))=>true,
        _=>false
    }
}
fn vr_r5_binary_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_question_is_binary(q){return false;}
    match(vr_first_binary_polarity(gt),vr_first_binary_polarity(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}
fn vr_r5_direction_conflict(gt:&[u8],ans:&[u8])->bool{
    match(vr_direction(gt),vr_direction(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}'''

_R5_SCORE = r'''unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}
    let qb=q.as_bytes();let gb=gt.as_bytes();let ab=a.as_bytes();
    if vr_r5_normalized_equal(gb,ab){return(1.0,1.0,1.0,1.0);}
    let mut score=rank_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);
    if !score.is_finite(){return(0.0,0.0,0.0,0.0);}
    score=score.clamp(0.0,1.0);

    let polarity_conflict=vr_opposite(gb,ab)||vr_r5_polarity_conflict(gb,ab);
    let entity_conflict=vr_r5_entity_conflict(qb,gb,ab);
    let numeric_equiv=vr_r5_numeric_equal(qb,gb,ab);
    let numeric_mismatch=vr_r5_numeric_mismatch(qb,gb,ab);
    let binary_conflict=vr_r5_binary_conflict(qb,gb,ab);
    let direction_conflict=vr_r5_direction_conflict(gb,ab);
    let negation_conflict=vr_r5_negation_conflict(gb,ab);
    let tail_bad=vr_r5_tail_bad(ab);

    // Strong caps are reserved for high-confidence contradictions. They do not
    // multiply already-correct semantic scores and therefore avoid the blanket
    // score collapse that hurt the 0.0855 candidate.
    if polarity_conflict||binary_conflict||direction_conflict{score=score.min(0.12);}
    else if entity_conflict{score=score.min(0.18);}
    else if numeric_mismatch{score=score.min(0.25);}
    if negation_conflict{score=score.min(0.20);}
    if tail_bad{score=score.min(0.20);}
    if numeric_equiv&&!tail_bad&&!negation_conflict{score=score.max(0.90);}

    let final_score=vr_r5_safe_pow(score);
    (final_score,score,1.0,1.0)
}'''

// Exact 14.0 monotone calibration. This is the historical transform used by
// commit 76486fa and is intentionally retained rather than using pow/sigmoid.
_R5_CALIBRATION = r'''fn vr_r5_safe_pow(score:f32)->f32{
    if !score.is_finite(){return 0.0;}
    if score<=0.0{return 0.0;}
    if score>=1.0{return 1.0;}
    let t=score.clamp(0.0,1.0);
    let y=t+0.9*t*(1.0-t)*(2.0*t-1.0);
    if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}
}'''

def replace_function(wrapper:str,marker:str,replacement:str)->str:
    start=wrapper.find(marker)
    if start<0: raise SystemExit(f"final builder: missing function marker: {marker}")
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
    raise SystemExit(f"final builder: unterminated function: {marker}")

def patch()->None:
    _BASE_PATCH()
    b=_R5_HELPERS+"\n"+build_candidate.WRAPPER
    b=replace_function(b,"unsafe fn veridex_score(",_R5_SCORE)
    b=_R5_CALIBRATION+"\n"+b
    build_candidate.WRAPPER=b

if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch
    build_candidate_fast.main()
