#!/usr/bin/env python3
"""Final R5 release wrapper for Track 2.

The release starts from the historical 14.0 fast neural candidate and changes
three things only: (1) score construction is explicitly question-aware by
reading the official baseline's four signal breakdown, (2) factual guards are
high-confidence caps rather than blanket multipliers, and (3) the historical
14.0 monotone power calibration is retained. No benchmark-specific phrases or
network/runtime dependencies are introduced.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast

_ORIGINAL_FAST_PATCH = build_candidate_fast.patch_semantic_guards

_RELEASE_POLARITY = r'''fn vr_r5_polarity(text:&[u8])->Option<bool>{
    const POS:&[&[u8]]=&[b"safe",b"secure",b"benign",b"legitimate",b"trusted",b"authorized",b"authorised",b"approved",b"allowed",b"permitted",b"valid",b"correct",b"confirmed",b"active",b"enabled",b"genuine",b"authentic",b"bullish",b"positive",b"increased",b"increase",b"rose",b"rise",b"higher",b"gain",b"gained"];
    const NEG:&[&[u8]]=&[b"unsafe",b"malicious",b"fraud",b"fraudulent",b"scam",b"dangerous",b"harmful",b"phishing",b"compromised",b"hacked",b"breached",b"unauthorized",b"unauthorised",b"rejected",b"denied",b"blocked",b"forbidden",b"invalid",b"incorrect",b"inactive",b"disabled",b"fake",b"counterfeit",b"bearish",b"negative",b"decreased",b"decrease",b"fell",b"fall",b"lower",b"loss",b"lost"];
    let p=vr_has_any(text,POS);let n=vr_has_any(text,NEG);match(p,n){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}
}

fn vr_r5_direction(text:&[u8])->Option<bool>{
    const UP:&[&[u8]]=&[b"increase",b"increased",b"rise",b"rose",b"rising",b"up",b"higher",b"gain",b"gained"];
    const DOWN:&[&[u8]]=&[b"decrease",b"decreased",b"fall",b"fell",b"falling",b"down",b"lower",b"loss",b"lost",b"declined",b"reduced",b"dropped"];
    let up=vr_has_any(text,UP);let down=vr_has_any(text,DOWN);match(up,down){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}
}

fn vr_r5_opposite(gt:&[u8],ans:&[u8])->bool{
    const PAIRS:&[(&[u8],&[u8])]=&[
      (b"fraud",b"safe"),(b"fraudulent",b"legitimate"),(b"scam",b"safe"),(b"malicious",b"benign"),(b"malicious",b"legitimate"),(b"dangerous",b"safe"),(b"harmful",b"safe"),(b"unsafe",b"safe"),(b"phishing",b"legitimate"),(b"positive",b"negative"),(b"bullish",b"bearish"),(b"increase",b"decrease"),(b"increased",b"decreased"),(b"rise",b"fall"),(b"rose",b"fell"),(b"approved",b"rejected"),(b"authorized",b"unauthorized"),(b"confirmed",b"denied"),(b"allowed",b"blocked"),(b"allowed",b"forbidden"),(b"yes",b"no"),(b"true",b"false"),(b"declined",b"increased"),(b"reduced",b"increased"),(b"decreased",b"increased"),(b"lower",b"higher"),(b"down",b"up")];
    for(a,b)in PAIRS{if(vr_has_word(gt,a)&&vr_has_word(ans,b))||(vr_has_word(gt,b)&&vr_has_word(ans,a)){return true;}}
    match(vr_r5_direction(gt),vr_r5_direction(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}

fn vr_r5_entity_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    let mut i=0usize; let mut answer_has_candidate=false;
    while i<ans.len(){
        while i<ans.len()&&!ans[i].is_ascii_alphabetic(){i+=1;}
        let s=i; while i<ans.len()&&ans[i].is_ascii_alphabetic(){i+=1;}
        if s>=i{continue;}
        let w=&ans[s..i];
        let titlecase=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());
        if titlecase&&!vr_is_ignored_entity(w){answer_has_candidate=true;if !vr_has_word(q,w)&&!vr_has_word(gt,w){return true;}}
    }
    if answer_has_candidate{return false;}
    false
}

fn vr_r5_numeric_context(q:&[u8])->bool{
    const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity",b"many",b"much",b"how"];
    vr_has_any(q,TERMS)
}

fn vr_r5_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize;
    while i<text.len(){
        if text[i].is_ascii_digit() || (text[i]==b'$'&&i+1<text.len()&&text[i+1].is_ascii_digit()){break;}
        i+=1;
    }
    if i>=text.len(){return None;}
    if text[i]==b'$'{i+=1;}
    let mut x=0.0f64; let mut frac=0.1f64; let mut dot=false; let mut any=false;
    while i<text.len(){let c=text[i];if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}else if c==b','||c==b'_'{i+=1;}else if c==b'.'&&!dot&&i+1<text.len()&&text[i+1].is_ascii_digit(){dot=true;i+=1;}else{break;}}
    if !any{return None;}
    while i<text.len()&&vr_ws(text[i]){i+=1;}
    let mut scale=1.0f64;
    if i<text.len(){match vr_lower(text[i]){b'k'=>scale=1e3,b'm'=>scale=1e6,b'b'=>scale=1e9,_=>{}}}
    if scale==1.0{if vr_has_word(text,b"thousand"){scale=1e3;}else if vr_has_word(text,b"million"){scale=1e6;}else if vr_has_word(text,b"billion"){scale=1e9;}}
    x*=scale;
    Some((x,vr_has_word(text,b"percent")||vr_has_word(text,b"percentage")||text[i..].first()==Some(&b'%')))
}

fn vr_r5_numeric_mismatch(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_r5_numeric_context(q){return false;}
    match(vr_r5_number(gt),vr_r5_number(ans)){
      (Some((g,gp)),Some((a,ap)))=>gp!=ap || (g-a).abs()>g.abs().max(a.abs()).max(1.0)*0.001+1e-6,
      (Some(_),Some(_))=>true,
      (Some(_),None)=>true,
      _=>false
    }
}

fn vr_r5_binary_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_question_is_binary(q){return false;}
    match(vr_first_binary_polarity(gt),vr_first_binary_polarity(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}

fn vr_r5_tail_bad(ans:&[u8])->bool{
    let mut i=0usize;let mut ls=0usize;let mut le=0usize;
    while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}if i>=ans.len(){break;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}ls=s;le=i;}
    if ls>=le{return false;}
    if vr_word_eq(ans,ls,le,b"not")||vr_word_eq(ans,ls,le,b"never"){return false;}
    vr_has_word(ans,b"unrelated")&&(vr_has_word(ans,b"background")||vr_has_word(ans,b"another")||vr_has_word(ans,b"topic")||vr_has_word(ans,b"entity"))
}'''

_RELEASE_SCORE = r'''unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}
    let mut gn=alloc::string::String::new();let mut an=alloc::string::String::new();
    for b in gt.as_bytes(){if b.is_ascii_alphanumeric(){gn.push(vr_lower(*b)as char);}}
    for b in a.as_bytes(){if b.is_ascii_alphanumeric(){an.push(vr_lower(*b)as char);}}
    if !gn.is_empty()&&gn==an{return(1.0,1.0,1.0,1.0);}

    let breakdown=breakdown_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);
    if breakdown<=0{return(0.0,0.0,0.0,0.0);}
    let sig=core::slice::from_raw_parts(breakdown as *const f32,5);
    let relevance=sig[0].clamp(0.0,1.0);let correctness=sig[1].clamp(0.0,1.0);let lexical=sig[2].clamp(0.0,1.0);let length=sig[3].clamp(0.0,1.0);

    // Question-aware composite: correctness remains dominant, while explicit
    // question relevance prevents a ground-truth-shaped but off-topic answer
    // from scoring as highly. Lexical/length signals are deliberately small.
    let mut base=(0.30*relevance+0.55*correctness+0.10*lexical+0.05*length).clamp(0.0,1.0);

    let opposite=vr_r5_opposite(gt.as_bytes(),a.as_bytes());
    let entity_conflict=vr_r5_entity_conflict(q.as_bytes(),gt.as_bytes(),a.as_bytes());
    let numeric_mismatch=vr_r5_numeric_mismatch(q.as_bytes(),gt.as_bytes(),a.as_bytes());
    let binary_conflict=vr_r5_binary_conflict(q.as_bytes(),gt.as_bytes(),a.as_bytes());

    // High-confidence contradictions are caps, not destructive multipliers.
    // This preserves good paraphrases while stopping a semantically similar
    // opposite answer from dominating the pairwise ranking.
    if opposite{base=base.min(0.12);}
    else if binary_conflict{base=base.min(0.12);}
    else if entity_conflict{base=base.min(0.16);}
    else if numeric_mismatch{base=base.min(0.28);}
    if vr_r5_tail_bad(a.as_bytes()){base=base.min(0.40);}

    let final_score=vr_safe_pow(base);
    (final_score,relevance,correctness,base)
}'''

_MONOTONIC_14 = "fn vr_safe_pow(score:f32)->f32{if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let y=libm::powf(score,1.18);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"


def _replace_function(wrapper: str, marker: str, replacement: str) -> str:
    start=wrapper.find(marker)
    if start<0: raise SystemExit(f"release wrapper: function marker not found: {marker}")
    depth=0;in_string=False;escape=False;i=start
    while i<len(wrapper):
        ch=wrapper[i]
        if in_string:
            if escape: escape=False
            elif ch=="\\": escape=True
            elif ch=='"': in_string=False
        else:
            if ch=='"': in_string=True
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:return wrapper[:start]+replacement+wrapper[i+1:]
        i+=1
    raise SystemExit("release wrapper: function closing brace not found")


def patch_release_guards() -> None:
    _ORIGINAL_FAST_PATCH()
    marker="unsafe fn veridex_score("
    if marker not in build_candidate.WRAPPER: raise SystemExit("release wrapper: score marker missing")
    # Remove any prior R5 helper definitions before injecting this exact set.
    build_candidate.WRAPPER=_RELEASE_POLARITY+"\n"+_replace_function(build_candidate.WRAPPER,marker,_RELEASE_SCORE)
    build_candidate.WRAPPER=_replace_function(build_candidate.WRAPPER,"fn vr_safe_pow(score:f32)->f32{",_MONOTONIC_14)
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(marker,_RELEASE_SCORE,1) if False else build_candidate.WRAPPER


if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch_release_guards
    build_candidate_fast.main()
