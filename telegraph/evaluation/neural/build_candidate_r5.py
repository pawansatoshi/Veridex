#!/usr/bin/env python3
"""Build the final Track-2 R5 candidate.

R5 uses the proven fast neural scorer as the continuous semantic signal and
adds only conservative, high-confidence factual protections. It deliberately
does not re-read the baseline static breakdown buffer: the previous attempt
showed repeated identical scores on distinct mutated answers, so R5 now uses
the scalar rank_answer_base path to keep the ABI/dataflow identical to the
historically validated 14.0 scorer.
"""
from __future__ import annotations

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
        let c= text[i];
        if c.is_ascii_digit(){
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
    (vr_has_word(ans,b"not")||vr_has_word(ans,b"never"))&&! (vr_has_word(gt,b"not")||vr_has_word(gt,b"never"))
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

    // Keep the exact scalar path used by the validated 14.0 build. This avoids
    // any aliasing/static-buffer ambiguity while preserving the MiniLM+BM25
    // semantic representation as the primary continuous signal.
    let mut score=rank_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);
    if !score.is_finite(){return(0.0,0.0,0.0,0.0);}
    score=score.clamp(0.0,1.0);

    let entity_conflict=vr_r5_entity_conflict(qb,gb,ab);
    let opposite=vr_opposite(gb,ab);
    let numeric_equal=vr_r5_numeric_equal(qb,gb,ab);
    let numeric_mismatch=vr_r5_numeric_mismatch(qb,gb,ab);
    let binary_conflict=vr_r5_binary_conflict(qb,gb,ab);
    let direction_conflict=vr_r5_direction_conflict(gb,ab);
    let negation_conflict=vr_r5_negation_conflict(gb,ab);
    let tail_bad=vr_r5_tail_bad(ab);

    // High-confidence contradictions are caps, not multiplicative collapses.
    // This protects the ranking tail without turning every uncertain answer
    // into near-zero noise.
    if opposite||binary_conflict||direction_conflict{score=score.min(0.12);}
    else if entity_conflict{score=score.min(0.18);}
    else if numeric_mismatch{score=score.min(0.25);}
    if negation_conflict{score=score.min(0.20);}
    if tail_bad{score=score.min(0.20);}

    // A verified numeric paraphrase must not lose to a wrong-format/units
    // variant merely because lexical overlap is weaker.
    if numeric_equal{score=score.max(0.90);}

    (vr_r5_safe_pow(score),score,1.0,1.0)
}'''

_R5_CALIBRATION = r'''fn vr_r5_safe_pow(score:f32)->f32{
    if !score.is_finite(){return 0.0;}
    if score<=0.0{return 0.0;}
    if score>=1.0{return 1.0;}
    let y=libm::powf(score,1.18);
    if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}
}'''


def replace_function(wrapper:str,marker:str,replacement:str)->str:
    start=wrapper.find(marker)
    if start<0: raise SystemExit(f"r5 builder: missing function marker: {marker}")
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
    # Add only the R5-specific helpers; leave the fast builder's ABI/runtime
    # allocation and baseline implementation untouched.
    b=_R5_HELPERS+"\n"+b
    b=replace_function(b,"unsafe fn veridex_score(",_R5_SCORE)
    b=_R5_CALIBRATION+"\n"+b
    # The fast wrapper's exported breakdown remains available and the primary
    # rank path is the R5 veridex_score above.
    build_candidate.WRAPPER=b

if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch
    build_candidate_fast.main()
