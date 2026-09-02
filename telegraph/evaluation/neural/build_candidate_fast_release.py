#!/usr/bin/env python3
"""Final R5 release wrapper for Track 2."""
from __future__ import annotations
import build_candidate
import build_candidate_fast

_ORIGINAL_FAST_PATCH = build_candidate_fast.patch_semantic_guards

_R5_HELPERS = r'''fn vr_r5_polarity(text:&[u8])->Option<bool>{
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
    const PAIRS:&[(&[u8],&[u8])]=&[(b"fraud",b"safe"),(b"fraudulent",b"legitimate"),(b"scam",b"safe"),(b"malicious",b"benign"),(b"malicious",b"legitimate"),(b"dangerous",b"safe"),(b"harmful",b"safe"),(b"unsafe",b"safe"),(b"phishing",b"legitimate"),(b"positive",b"negative"),(b"bullish",b"bearish"),(b"increase",b"decrease"),(b"increased",b"decreased"),(b"rise",b"fall"),(b"rose",b"fell"),(b"approved",b"rejected"),(b"authorized",b"unauthorized"),(b"confirmed",b"denied"),(b"allowed",b"blocked"),(b"allowed",b"forbidden"),(b"yes",b"no"),(b"true",b"false"),(b"declined",b"increased"),(b"reduced",b"increased"),(b"decreased",b"increased"),(b"lower",b"higher"),(b"down",b"up")];
    for(a,b)in PAIRS{if(vr_has_word(gt,a)&&vr_has_word(ans,b))||(vr_has_word(gt,b)&&vr_has_word(ans,a)){return true;}}
    match(vr_r5_direction(gt),vr_r5_direction(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}
fn vr_r5_entity_anchor(text:&[u8])->bool{
    let mut i=0usize; while i<text.len(){while i<text.len()&&!text[i].is_ascii_alphabetic(){i+=1;}let s=i;while i<text.len()&&text[i].is_ascii_alphabetic(){i+=1;}if s>=i{continue;}let w=&text[s..i];let tc=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());if tc&&!vr_is_ignored_entity(w){return true;}}
    false
}
fn vr_r5_entity_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_r5_entity_anchor(gt){return false;}
    let mut i=0usize; while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphabetic(){i+=1;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphabetic(){i+=1;}if s>=i{continue;}let w=&ans[s..i];let tc=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());if tc&&!vr_is_ignored_entity(w)&&!vr_has_word(q,w)&&!vr_has_word(gt,w){return true;}}
    false
}
fn vr_r5_numeric_context(q:&[u8])->bool{const T:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity",b"many",b"much"];vr_has_any(q,T)}
fn vr_r5_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize;
    while i<text.len(){
        let c=text[i];
        // Ignore quarter labels such as Q1/Q2/Q3/Q4; they are not the measured value.
        if c.is_ascii_digit(){let prev=if i>0{vr_lower(text[i-1])}else{0};if prev==b'q'&&i+1<text.len()&&(text[i+1]==b'1'||text[i+1]==b'2'||text[i+1]==b'3'||text[i+1]==b'4'){i+=2;continue;}break;}
        if c==b'$'&&i+1<text.len()&&text[i+1].is_ascii_digit(){break;}
        i+=1;
    }
    if i>=text.len(){return None;} if text[i]==b'$'{i+=1;}
    let mut x=0.0f64;let mut frac=0.1f64;let mut dot=false;let mut any=false;
    while i<text.len(){let c=text[i];if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}else if c==b','||c==b'_'{i+=1;}else if c==b'.'&&!dot&&i+1<text.len()&&text[i+1].is_ascii_digit(){dot=true;i+=1;}else{break;}}
    if !any{return None;} while i<text.len()&&vr_ws(text[i]){i+=1;}
    let mut scale=1.0f64;if i<text.len(){match vr_lower(text[i]){b'k'=>scale=1e3,b'm'=>scale=1e6,b'b'=>scale=1e9,_=>{}}}
    if scale==1.0{if vr_has_word(text,b"thousand"){scale=1e3;}else if vr_has_word(text,b"million"){scale=1e6;}else if vr_has_word(text,b"billion"){scale=1e9;}}
    x*=scale;Some((x,vr_has_word(text,b"percent")||vr_has_word(text,b"percentage")||text[i..].first()==Some(&b'%')))
}
fn vr_r5_numeric_mismatch(q:&[u8],gt:&[u8],ans:&[u8])->bool{if !vr_r5_numeric_context(q){return false;}match(vr_r5_number(gt),vr_r5_number(ans)){(Some((g,gp)),Some((a,ap)))=>gp!=ap||(g-a).abs()>g.abs().max(a.abs()).max(1.0)*0.001+1e-6,(Some(_),None)=>true,(None,Some(_))=>true,_=>false}}
fn vr_r5_binary_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{if !vr_question_is_binary(q){return false;}match(vr_first_binary_polarity(gt),vr_first_binary_polarity(ans)){(Some(g),Some(a))=>g!=a,_=>false}}
fn vr_r5_tail_bad(ans:&[u8])->bool{let mut i=0usize;let mut ls=0usize;let mut le=0usize;while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}if i>=ans.len(){break;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}ls=s;le=i;}if ls>=le{return false;}vr_has_word(ans,b"unrelated")&&(vr_has_word(ans,b"background")||vr_has_word(ans,b"another")||vr_has_word(ans,b"topic")||vr_has_word(ans,b"entity"))}'''

_R5_SCORE = r'''unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}
    let mut gn=alloc::string::String::new();let mut an=alloc::string::String::new();for b in gt.as_bytes(){if b.is_ascii_alphanumeric(){gn.push(vr_lower(*b)as char);}}for b in a.as_bytes(){if b.is_ascii_alphanumeric(){an.push(vr_lower(*b)as char);}}if !gn.is_empty()&&gn==an{return(1.0,1.0,1.0,1.0);}
    let p=breakdown_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);if p<=0{return(0.0,0.0,0.0,0.0);}let s=core::slice::from_raw_parts(p as *const f32,5);let relevance=s[0].clamp(0.0,1.0);let correctness=s[1].clamp(0.0,1.0);let lexical=s[2].clamp(0.0,1.0);let length=s[3].clamp(0.0,1.0);
    // Correctness is the dominant signal; relevance supplies the question-aware constraint.
    let mut base=(0.30*relevance+0.55*correctness+0.10*lexical+0.05*length).clamp(0.0,1.0);
    let opposite=vr_r5_opposite(gt.as_bytes(),a.as_bytes());let entity_conflict=vr_r5_entity_conflict(q.as_bytes(),gt.as_bytes(),a.as_bytes());let numeric_mismatch=vr_r5_numeric_mismatch(q.as_bytes(),gt.as_bytes(),a.as_bytes());let binary_conflict=vr_r5_binary_conflict(q.as_bytes(),gt.as_bytes(),a.as_bytes());
    if opposite||binary_conflict{base=base.min(0.12);}else if entity_conflict{base=base.min(0.16);}else if numeric_mismatch{base=base.min(0.28);}if vr_r5_tail_bad(a.as_bytes()){base=base.min(0.40);}
    let final_score=vr_safe_pow(base);(final_score,base,relevance,correctness)
}'''

_MONOTONIC_14="fn vr_safe_pow(score:f32)->f32{if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let y=libm::powf(score,1.18);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"

def _replace_function(wrapper:str,marker:str,replacement:str)->str:
    start=wrapper.find(marker)
    if start<0: raise SystemExit(f"release wrapper: function marker not found: {marker}")
    depth=0;in_string=False;escape=False;i=start
    while i<len(wrapper):
        ch=wrapper[i]
        if in_string:
            if escape: escape=False
            elif ch=='\\': escape=True
            elif ch=='"': in_string=False
        else:
            if ch=='"': in_string=True
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:return wrapper[:start]+replacement+wrapper[i+1:]
        i+=1
    raise SystemExit('release wrapper: unmatched braces')

def patch_release_guards()->None:
    _ORIGINAL_FAST_PATCH()
    build_candidate.WRAPPER=_R5_HELPERS+"\n"+_replace_function(build_candidate.WRAPPER,"unsafe fn veridex_score(",_R5_SCORE)
    build_candidate.WRAPPER=_replace_function(build_candidate.WRAPPER,"fn vr_safe_pow(score:f32)->f32{",_MONOTONIC_14)

if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch_release_guards
    build_candidate_fast.main()
