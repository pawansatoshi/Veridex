#!/usr/bin/env python3
"""Robust Track-2 fast release builder.

The prior release wrapper depended on exact multi-line text anchors. This
version patches semantic functions by name/balanced braces, then reuses the
already-vetted release guard bodies. No evaluator/checker thresholds change.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release as base


def _replace_fn(src: str, name: str, replacement: str) -> str:
    marker = f"fn {name}("
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"robust release patch: function not found: {name}")
    brace = src.find("{", start)
    if brace < 0:
        raise RuntimeError(f"robust release patch: opening brace not found: {name}")
    depth = 0
    quote = None
    esc = False
    i = brace
    while i < len(src):
        ch = src[i]
        if quote:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == quote:
                quote = None
        else:
            if ch in ('"', "'"):
                quote = ch
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return src[:start] + replacement + src[i + 1 :]
        i += 1
    raise RuntimeError(f"robust release patch: unmatched braces: {name}")


DIRECTION = r'''fn vr_direction(text:&[u8])->Option<bool>{
    const UP:&[&[u8]]=&[b"increase",b"increased",b"rise",b"rose",b"rising",b"up",b"higher",b"gain",b"gained"];
    const DOWN:&[&[u8]]=&[b"decrease",b"decreased",b"fall",b"fell",b"falling",b"down",b"lower",b"loss",b"lost",b"declined",b"reduced",b"dropped"];
    let up=vr_has_any(text,UP);let down=vr_has_any(text,DOWN);match(up,down){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}
}'''

OPPOSITE = r'''fn vr_opposite(gt:&[u8],ans:&[u8])->bool{
    const PAIRS:&[(&[u8],&[u8])]=&[
      (b"fraud",b"safe"),(b"fraudulent",b"legitimate"),(b"scam",b"safe"),(b"malicious",b"benign"),(b"malicious",b"legitimate"),(b"dangerous",b"safe"),(b"harmful",b"safe"),(b"unsafe",b"safe"),(b"phishing",b"legitimate"),(b"positive",b"negative"),(b"bullish",b"bearish"),(b"increase",b"decrease"),(b"increased",b"decreased"),(b"rise",b"fall"),(b"rose",b"fell"),(b"approved",b"rejected"),(b"authorized",b"unauthorized"),(b"confirmed",b"denied"),(b"allowed",b"blocked"),(b"allowed",b"forbidden"),(b"yes",b"no"),(b"true",b"false"),(b"declined",b"increased"),(b"reduced",b"increased"),(b"decreased",b"increased"),(b"lower",b"higher"),(b"down",b"up"),(b"loss",b"gain")];
    for(a,b)in PAIRS{if(vr_has_word(gt,a)&&vr_has_word(ans,b))||(vr_has_word(gt,b)&&vr_has_word(ans,a)){return true;}}
    match(vr_direction(gt),vr_direction(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}'''

NUMBER = r'''fn vr_first_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize; while i<text.len() && !text[i].is_ascii_digit(){i+=1;} if i>=text.len(){return None;}
    let mut x=0.0f64; let mut frac=0.1f64; let mut dot=false; let mut any=false;
    while i<text.len(){let c=text[i]; if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}else if c==b','||c==b'_'{i+=1;}else if c==b'.'&&!dot&&i+1<text.len()&&text[i+1].is_ascii_digit(){dot=true;i+=1;}else{break;}}
    if !any{return None;} while i<text.len()&&vr_ws(text[i]){i+=1;}
    let mut scaled=false;
    if i<text.len(){match vr_lower(text[i]){b'k'|b'm'|b'b' if i+1==text.len()||!text[i+1].is_ascii_alphabetic()=>{match vr_lower(text[i]){b'k'=>x*=1e3,b'm'=>x*=1e6,b'b'=>x*=1e9,_=>{}}scaled=true;},_=>{}}}
    if !scaled{if vr_has_word(text,b"thousand"){x*=1e3;}else if vr_has_word(text,b"million"){x*=1e6;}else if vr_has_word(text,b"billion"){x*=1e9;}}
    Some((x,vr_has_word(text,b"percent")||vr_has_word(text,b"percentage")||text[i..].first()==Some(&b'%')))
}'''


def robust_patch() -> None:
    w = build_candidate.WRAPPER
    if "fn vr_direction(" not in w:
        pos = w.find("fn vr_opposite(")
        if pos < 0:
            raise RuntimeError("robust release patch: opposite insertion point missing")
        w = w[:pos] + DIRECTION + "\n" + w[pos:]
    w = _replace_fn(w, "vr_opposite", OPPOSITE)
    w = _replace_fn(w, "vr_first_number", NUMBER)

    # Reuse the vetted release bodies, but add/replace by function boundary.
    if "fn vr_release_material_conflict(" not in w:
        pos = w.find("fn vr_question_guard(")
        if pos < 0:
            raise RuntimeError("robust release patch: question guard insertion point missing")
        w = w[:pos] + base._RELEASE_CONFLICT + "\n" + w[pos:]
    if "fn vr_release_binary_fragment(" not in w:
        pos = w.find("fn vr_question_guard(")
        if pos < 0:
            raise RuntimeError("robust release patch: binary insertion point missing")
        w = w[:pos] + base._RELEASE_BINARY_FRAGMENT + "\n" + w[pos:]
    if "fn vr_release_negation_conflict(" not in w:
        pos = w.find("fn vr_question_guard(")
        if pos < 0:
            raise RuntimeError("robust release patch: negation insertion point missing")
        w = w[:pos] + base._RELEASE_NEGATION + "\n" + w[pos:]
    if "fn vr_release_tail_contamination(" not in w:
        pos = w.find("fn vr_question_guard(")
        if pos < 0:
            raise RuntimeError("robust release patch: tail insertion point missing")
        w = w[:pos] + base._RELEASE_TAIL + "\n" + w[pos:]

    w = _replace_fn(w, "vr_question_guard", base._RELEASE_GUARD)
    w = _replace_fn(w, "veridex_score", base._RELEASE_SCORE)
    w = _replace_fn(w, "vr_safe_pow", base._MONOTONIC_SHARPEN)
    build_candidate.WRAPPER = w


if __name__ == "__main__":
    # Replace only the semantic patch hook. The fast builder still owns the
    # pinned checkout, tokenizer/layer caps and actual Rust/WASM build.
    build_candidate_fast.patch_semantic_guards = robust_patch
    build_candidate_fast.main()
