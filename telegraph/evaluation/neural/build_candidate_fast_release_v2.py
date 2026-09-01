#!/usr/bin/env python3
"""Robust Track-2 fast release builder.

Replaces brittle multi-line text anchors with function-boundary patching. The
pinned Telegraph baseline and fast tokenizer/layer constraints remain owned by
the existing fast builder; only wrapper patching is made drift-tolerant.
"""
from __future__ import annotations

import re

import build_candidate
import build_candidate_fast
import build_candidate_fast_release as base


def _replace_fn(src: str, name: str, replacement: str) -> str:
    marker = f"fn {name}("
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"robust release patch: function not found: {name}")
    if start >= 7 and src[start - 7:start] == "unsafe ":
        start -= 7
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


def _insert_before_guard(src: str, block: str) -> str:
    pos = src.find("fn vr_question_guard(")
    if pos < 0:
        raise RuntimeError("robust release patch: question guard insertion point missing")
    return src[:pos] + block + "\n" + src[pos:]


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

NUMERIC_CONTEXT = r'''fn vr_numeric_context(q:&[u8])->bool{const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity"];vr_has_any(q,TERMS)}'''


# Split the vetted release conflict bundle into its individual functions so
# existing functions are replaced, not duplicated.
def _functions(block: str) -> list[tuple[str, str]]:
    names = re.findall(r"(?:unsafe\s+)?fn\s+([A-Za-z0-9_]+)\(", block)
    out: list[tuple[str, str]] = []
    for name in names:
        marker = f"fn {name}("
        start = block.find(marker)
        if start >= 7 and block[start - 7:start] == "unsafe ":
            start -= 7
        brace = block.find("{", start)
        depth = 0
        quote = None
        esc = False
        i = brace
        while i < len(block):
            ch = block[i]
            if quote:
                if esc: esc = False
                elif ch == "\\": esc = True
                elif ch == quote: quote = None
            else:
                if ch in ('"', "'"): quote = ch
                elif ch == "{": depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        out.append((name, block[start:i+1]))
                        break
            i += 1
    return out


def robust_patch() -> None:
    w = build_candidate.WRAPPER

    if "fn vr_direction(" not in w:
        w = _insert_before_guard(w, DIRECTION)
    w = _replace_fn(w, "vr_opposite", OPPOSITE)
    w = _replace_fn(w, "vr_first_number", NUMBER)

    for name, fn in _functions(base._RELEASE_CONFLICT):
        if f"fn {name}(" in w:
            w = _replace_fn(w, name, fn)
        else:
            w = _insert_before_guard(w, fn)

    if "fn vr_numeric_context(" not in w:
        w = _insert_before_guard(w, NUMERIC_CONTEXT)

    for name, fn in (
        ("vr_release_binary_fragment", base._RELEASE_BINARY_FRAGMENT),
        ("vr_release_negation_conflict", base._RELEASE_NEGATION),
        ("vr_release_tail_contamination", base._RELEASE_TAIL),
    ):
        if f"fn {name}(" in w:
            w = _replace_fn(w, name, fn)
        else:
            w = _insert_before_guard(w, fn)

    w = _replace_fn(w, "vr_question_guard", base._RELEASE_GUARD)
    w = _replace_fn(w, "veridex_score", base._RELEASE_SCORE)
    w = _replace_fn(w, "vr_safe_pow", base._MONOTONIC_SHARPEN)
    build_candidate.WRAPPER = w


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = robust_patch
    build_candidate_fast.main()
