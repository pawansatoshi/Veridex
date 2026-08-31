#!/usr/bin/env python3
"""Release wrapper for the bounded-performance Track 2 builder.

This wrapper intentionally delegates numeric/equivalence enforcement to the
current fast builder. It only replaces semantic contradiction handling and the
final monotonic calibration layer. Keeping those responsibilities separate
prevents brittle string-patching when the fast scorer evolves.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast

_ORIGINAL_FAST_PATCH = build_candidate_fast.patch_semantic_guards

_RELEASE_CONFLICT = r'''fn vr_release_predicate_polarity(text:&[u8])->Option<bool>{
    const POS:&[&[u8]]=&[
      b"secure",b"safe",b"protected",b"uncompromised",b"clean",b"benign",
      b"legitimate",b"trusted",b"authorized",b"authorised",b"approved",
      b"allowed",b"permitted",b"valid",b"correct",b"active",b"enabled",
      b"healthy",b"intact",b"solvent",b"genuine",b"authentic",b"confirmed"
    ];
    const NEG:&[&[u8]]=&[
      b"compromised",b"unsafe",b"vulnerable",b"malicious",b"fraud",b"fraudulent",
      b"scam",b"dangerous",b"harmful",b"hacked",b"breached",b"phishing",
      b"unauthorized",b"unauthorised",b"rejected",b"denied",b"blocked",
      b"forbidden",b"invalid",b"incorrect",b"inactive",b"disabled",b"unhealthy",
      b"insolvent",b"fake",b"counterfeit"
    ];
    let p=vr_has_any(text,POS);let n=vr_has_any(text,NEG);
    match(p,n){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}
}

// A yes/no answer must be interpreted relative to the polarity of the
// proposition being asked. Ground truth is often only "yes"/"no", so comparing
// GT predicate polarity with answer predicate polarity is insufficient.
// Examples:
//   Q: "Was transfer denied?" + "No, it was approved."   => consistent
//   Q: "Was transfer denied?" + "No, it was rejected."   => contradictory
//   Q: "Was transfer unauthorized?" + "Yes, it was unauthorized." => consistent
fn vr_question_predicate_conflict(q:&[u8],_gt:&[u8],ans:&[u8])->bool{
    if !vr_question_is_binary(q){return false;}
    match(vr_release_predicate_polarity(q),vr_release_predicate_polarity(ans),vr_first_binary_polarity(ans)){
      (Some(qp),Some(ap),Some(bin))=>if bin{ap!=qp}else{ap==qp},
      _=>false
    }
}

fn vr_release_entity_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    let mut i=0usize;
    while i<ans.len(){
        while i<ans.len()&&!ans[i].is_ascii_alphabetic(){i+=1;}
        let s=i;while i<ans.len()&&ans[i].is_ascii_alphabetic(){i+=1;}
        if s>=i{continue;}
        let word=&ans[s..i];
        let titlecase=word.len()>=3&&word[0].is_ascii_uppercase()&&word[1..].iter().any(|b|b.is_ascii_lowercase());
        if titlecase&&!vr_is_ignored_entity(word)&&!vr_has_word(q,word)&&!vr_has_word(gt,word){return true;}
    }
    false
}

fn vr_release_numeric_equivalent(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_numeric_context(q){return false;}
    match(vr_first_number(gt),vr_first_number(ans)){
      (Some((g,gp)),Some((a,ap)))=>gp==ap&&(g-a).abs()<=g.abs().max(a.abs()).max(1.0)*1e-9,
      _=>false
    }
}'''

// Treat only genuinely incomplete deictic fragments as undercomplete. A full
// answer such as "No, it was approved." is four words and must not receive the
// same penalty as the two-word mutant "No, it".
_RELEASE_BINARY_FRAGMENT = r'''fn vr_release_binary_fragment(ans:&[u8])->bool{
    let mut words=0usize;let mut saw_binary=false;let mut saw_deictic=false;let mut i=0usize;
    while i<ans.len(){
        while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}
        let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}
        if s>=i{continue;}
        words+=1;if words>2{return false;}
        let w=&ans[s..i];
        if vr_word_eq(ans,s,i,b"yes")||vr_word_eq(ans,s,i,b"no")||vr_word_eq(ans,s,i,b"true")||vr_word_eq(ans,s,i,b"false"){saw_binary=true;}
        if vr_word_eq(ans,s,i,b"it")||vr_word_eq(ans,s,i,b"this")||vr_word_eq(ans,s,i,b"that")||vr_word_eq(ans,s,i,b"they"){saw_deictic=true;}
        let _=w;
    }
    saw_binary&&saw_deictic
}'''

_RELEASE_NEGATION = r'''fn vr_release_negation_conflict(gt:&[u8],ans:&[u8])->bool{
    let ans_not=vr_has_word(ans,b"not")||vr_has_word(ans,b"never");
    let gt_not=vr_has_word(gt,b"not")||vr_has_word(gt,b"never");
    ans_not&&!gt_not
}'''

_RELEASE_GUARD = r'''fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let mut g=1.0f32;

    // Factual/entity checks must run for both binary and ordinary factual
    // questions. The previous implementation accidentally scoped them to
    // yes/no questions, which let "Microsoft ..." beat the correct
    // cross-unit numeric paraphrase for "what was ... revenue for Apple?".
    let entity_conflict=vr_release_entity_conflict(q,gt,ans);
    if entity_conflict{g*=0.02;}

    let numeric_equiv=vr_release_numeric_equivalent(q,gt,ans);
    if numeric_equiv&&!entity_conflict{
        // Numeric equivalence is a factual confirmation, not a multiplier
        // outside the scoring range. The fast scorer already performs the
        // bounded high-score lift for verified numeric equivalence.
        g=1.0;
    }else if vr_numeric_context(q){
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
    g
}'''

_MONOTONIC_SHARPEN = "fn vr_safe_pow(score:f32)->f32{if !score.is_finite(){return 0.0;}if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let t=score.clamp(0.0,1.0);let y=t+t*t*(3.0-2.0*t)*(1.0-t);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}"


def _replace_function(wrapper: str, marker: str, replacement: str) -> str:
    start=wrapper.find(marker)
    if start<0:
        raise SystemExit(f"release wrapper: function marker not found: {marker}")
    depth=0;in_string=False;escape=False;i=start;end=None
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
                if depth==0:
                    end=i+1;break
        i+=1
    if end is None: raise SystemExit("release wrapper: function closing brace not found")
    return wrapper[:start]+replacement+wrapper[end:]


def patch_release_guards() -> None:
    _ORIGINAL_FAST_PATCH()
    if "fn vr_question_predicate_conflict(" in build_candidate.WRAPPER:
        build_candidate.WRAPPER=_replace_function(
            build_candidate.WRAPPER,
            "fn vr_question_predicate_conflict(",
            _RELEASE_CONFLICT,
        )
    else:
        build_candidate.WRAPPER=_RELEASE_CONFLICT+"\n"+build_candidate.WRAPPER

    if "fn vr_release_binary_fragment(" not in build_candidate.WRAPPER:
        marker="fn vr_question_guard("
        pos=build_candidate.WRAPPER.find(marker)
        if pos<0: raise SystemExit("release wrapper: question guard marker not found")
        build_candidate.WRAPPER=build_candidate.WRAPPER[:pos]+_RELEASE_BINARY_FRAGMENT+"\n"+build_candidate.WRAPPER[pos:]

    if "fn vr_release_negation_conflict(" not in build_candidate.WRAPPER:
        marker="fn vr_question_guard("
        pos=build_candidate.WRAPPER.find(marker)
        if pos<0: raise SystemExit("release wrapper: question guard marker not found")
        build_candidate.WRAPPER=build_candidate.WRAPPER[:pos]+_RELEASE_NEGATION+"\n"+build_candidate.WRAPPER[pos:]

    build_candidate.WRAPPER=_replace_function(
        build_candidate.WRAPPER,
        "fn vr_question_guard(",
        _RELEASE_GUARD,
    )

    build_candidate.WRAPPER=_replace_function(
        build_candidate.WRAPPER,
        "fn vr_safe_pow(score:f32)->f32{",
        _MONOTONIC_SHARPEN,
    )


if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch_release_guards
    build_candidate_fast.main()
