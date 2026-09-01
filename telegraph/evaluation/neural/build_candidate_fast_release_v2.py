#!/usr/bin/env python3
"""Robust Track-2 fast release builder.

Uses function-boundary replacement instead of brittle multi-line source
anchors. Existing vetted release guards are inserted/replaced one function at
a time, so duplicate definitions and unsafe-prefix corruption cannot occur.
"""
from __future__ import annotations

import re

import build_candidate
import build_candidate_fast
import build_candidate_fast_release as base


def _find_function(src: str, name: str) -> tuple[int, int] | None:
    pat = re.compile(r"(?m)^(?P<prefix>\s*)(?P<attrs>(?:(?:pub)\s+)?(?:(?:unsafe)\s+)?fn\s+)" + re.escape(name) + r"\s*\(")
    m = pat.search(src)
    if not m:
        return None
    brace = src.find("{", m.start())
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
            if ch == '"':
                quote = '"'
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return m.start(), i + 1
        i += 1
    raise RuntimeError(f"robust release patch: unmatched braces: {name}")


def _extract_function(block: str, name: str) -> str:
    found = _find_function(block, name)
    if not found:
        raise RuntimeError(f"release helper missing: {name}")
    start, end = found
    return block[start:end].strip()


def _upsert_function(src: str, name: str, replacement: str) -> str:
    found = _find_function(src, name)
    if found:
        start, end = found
        return src[:start] + replacement + src[end:]
    guard = "fn vr_question_guard("
    pos = src.find(guard)
    if pos < 0:
        raise RuntimeError("robust release patch: question guard insertion point missing")
    return src[:pos] + replacement + "\n" + src[pos:]


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

NUMERIC_CONTEXT = r'''fn vr_numeric_context(q:&[u8])->bool{
    const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity"];
    vr_has_any(q,TERMS)
}'''


def robust_patch() -> None:
    w = build_candidate.WRAPPER
    if "fn vr_direction(" not in w:
        pos = w.find("fn vr_opposite(")
        if pos < 0:
            raise RuntimeError("robust release patch: opposite insertion point missing")
        w = w[:pos] + DIRECTION + "\n" + w[pos:]
    w = _upsert_function(w, "vr_opposite", OPPOSITE)
    w = _upsert_function(w, "vr_first_number", NUMBER)
    if "fn vr_numeric_context(" not in w:
        w = _upsert_function(w, "vr_numeric_context", NUMERIC_CONTEXT)

    # Merge the vetted release helper bundle one function at a time. This
    # avoids injecting a multi-function block over an existing function.
    release_names = [
        "vr_release_predicate_polarity",
        "vr_question_predicate_conflict",
        "vr_release_entity_conflict",
        "vr_release_numeric_equivalent",
        "vr_release_has_currency",
        "vr_release_unit_completeness",
    ]
    for name in release_names:
        w = _upsert_function(w, name, _extract_function(base._RELEASE_CONFLICT, name))

    for name, block in (
        ("vr_release_binary_fragment", base._RELEASE_BINARY_FRAGMENT),
        ("vr_release_negation_conflict", base._RELEASE_NEGATION),
        ("vr_release_tail_contamination", base._RELEASE_TAIL),
    ):
        w = _upsert_function(w, name, _extract_function(block, name))

    w = _upsert_function(w, "vr_question_guard", base._RELEASE_GUARD)
    w = _upsert_function(w, "veridex_score", base._RELEASE_SCORE)
    w = _upsert_function(w, "vr_safe_pow", base._MONOTONIC_SHARPEN)
    build_candidate.WRAPPER = w


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = robust_patch
    build_candidate_fast.main()
