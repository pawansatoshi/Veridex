#!/usr/bin/env python3
"""Build a lab-hardened Track-2 candidate without brittle source anchors.

The overlay reuses the robust function-boundary patcher from
build_candidate_fast_release_v2 and adds material-conflict scoring by replacing
complete Rust functions. It never searches for a fragile multi-line Python
source fragment inside the canonical release builder.
"""
from __future__ import annotations

import re

import build_candidate
import build_candidate_fast
import build_candidate_fast_release_v2 as robust


MATERIAL_HELPER = r'''fn vr_release_material_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    let _=q;
    if vr_has_word(ans,b"opposite") && (vr_has_word(ans,b"conclusion")||vr_has_word(ans,b"result")||vr_has_word(ans,b"final")){return true;}
    if vr_has_word(ans,b"different") && (vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"period")||vr_has_word(ans,b"time")){return true;}
    if vr_has_word(ans,b"another") && (vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"period")||vr_has_word(ans,b"time")){return true;}
    if vr_has_word(gt,b"issued") && vr_has_word(ans,b"received"){return true;}
    if vr_has_word(gt,b"received") && vr_has_word(ans,b"issued"){return true;}
    if vr_has_word(gt,b"sent") && vr_has_word(ans,b"received"){return true;}
    if vr_has_word(gt,b"received") && vr_has_word(ans,b"sent"){return true;}
    if vr_has_word(gt,b"bought") && vr_has_word(ans,b"sold"){return true;}
    if vr_has_word(gt,b"sold") && vr_has_word(ans,b"bought"){return true;}
    if vr_has_word(gt,b"caused") && vr_has_word(ans,b"prevented"){return true;}
    if vr_has_word(gt,b"prevented") && vr_has_word(ans,b"caused"){return true;}
    if vr_has_word(gt,b"increased") && vr_has_word(ans,b"decreased"){return true;}
    if vr_has_word(gt,b"decreased") && vr_has_word(ans,b"increased"){return true;}
    if vr_has_word(gt,b"rose") && vr_has_word(ans,b"fell"){return true;}
    if vr_has_word(gt,b"fell") && vr_has_word(ans,b"rose"){return true;}
    if vr_has_word(gt,b"approved") && vr_has_word(ans,b"rejected"){return true;}
    if vr_has_word(gt,b"rejected") && vr_has_word(ans,b"approved"){return true;}
    false
}'''

MATERIAL_FACTOR = r'''const VR_MATERIAL_FACTOR:f32=0.04;
const VR_MATERIAL_CAP:f32=0.20;'''


def _replace_function(src: str, marker: str, replacement: str) -> str:
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"lab overlay: function marker not found: {marker}")
    brace = src.find("{", start)
    if brace < 0:
        raise RuntimeError(f"lab overlay: opening brace not found: {marker}")
    depth = 0
    quote = None
    escaped = False
    i = brace
    while i < len(src):
        ch = src[i]
        if quote is not None:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
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
                    return src[:start] + replacement + src[i + 1:]
        i += 1
    raise RuntimeError(f"lab overlay: unmatched braces: {marker}")


def _upsert_function(src: str, name: str, replacement: str) -> str:
    pattern = re.compile(
        r"(?m)^(?P<prefix>\s*)(?P<attrs>(?:(?:pub)\s+)?(?:(?:unsafe)\s+)?fn\s+)"
        + re.escape(name)
        + r"\s*\("
    )
    m = pattern.search(src)
    if not m:
        anchor = "fn vr_question_guard("
        pos = src.find(anchor)
        if pos < 0:
            raise RuntimeError(f"lab overlay: insertion point missing for {name}")
        return src[:pos] + replacement + "\n" + src[pos:]
    return _replace_function(src, f"fn {name}(" if f"fn {name}(" in src[m.start():m.end()+64] else name + "(", replacement)


def _function_span(src: str, name: str) -> tuple[int, int] | None:
    pattern = re.compile(
        r"(?m)^(?:\s*)(?:(?:pub)\s+)?(?:(?:unsafe)\s+)?fn\s+" + re.escape(name) + r"\s*\("
    )
    m = pattern.search(src)
    if not m:
        return None
    brace = src.find("{", m.start())
    if brace < 0:
        raise RuntimeError(f"lab overlay: opening brace not found: {name}")
    depth = 0
    quote = None
    escaped = False
    i = brace
    while i < len(src):
        ch = src[i]
        if quote is not None:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
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
    raise RuntimeError(f"lab overlay: unmatched braces: {name}")


def _ensure_helper(wrapper: str) -> str:
    if "fn vr_release_material_conflict(" in wrapper:
        return wrapper
    anchor = "fn vr_question_guard("
    pos = wrapper.find(anchor)
    if pos < 0:
        raise RuntimeError("lab overlay: question guard function not found")
    return wrapper[:pos] + MATERIAL_HELPER + "\n" + wrapper[pos:]


def patch() -> None:
    # Reuse the already-tested function-level release patcher.
    robust.robust_patch()
    wrapper = build_candidate.WRAPPER
    wrapper = _ensure_helper(wrapper)

    # Replace the complete question guard with an equivalent robust guard that
    # additionally applies material-conflict penalties.
    guard = r'''fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let mut g=1.0f32;
    let entity_conflict=vr_release_entity_conflict(q,gt,ans); if entity_conflict{g*=0.02;}
    let numeric_equiv=vr_release_numeric_equivalent(q,gt,ans); let complete_numeric=vr_release_unit_completeness(q,gt,ans);
    if numeric_equiv&&!entity_conflict&&complete_numeric{g=1.0;} else if numeric_equiv&&!complete_numeric{g*=0.62;} else if vr_numeric_context(q){
        match(vr_first_number(gt),vr_first_number(ans)){(Some(_),Some(_))=>g*=0.05,(Some(_),None)=>g*=0.65,_=>{}}
    }
    if vr_question_is_binary(q){
        if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}}
        if vr_question_predicate_conflict(q,gt,ans){g*=0.06;}
        if vr_release_binary_fragment(ans){g*=0.20;}
    }
    if vr_release_negation_conflict(gt,ans){g*=0.05;}
    if vr_release_tail_contamination(ans){g*=0.05;}
    if vr_release_material_conflict(q,gt,ans){g*=VR_MATERIAL_FACTOR;}
    g
}'''
    wrapper = _replace_function(wrapper, "fn vr_question_guard(", guard)

    score_span = _function_span(wrapper, "veridex_score")
    if score_span is None:
        raise RuntimeError("lab overlay: veridex_score function not found")
    start, end = score_span
    score = wrapper[start:end]
    if "let mut final_score=vr_safe_pow(shaped_base*fg*qg);" in score:
        score = score.replace(
            "let mut final_score=vr_safe_pow(shaped_base*fg*qg);",
            "let mut final_score=vr_safe_pow(shaped_base*fg*qg);",
            1,
        )
    wrapper = wrapper[:start] + score + wrapper[end:]

    # Keep material constants close to the helper and ensure a single definition.
    if "const VR_MATERIAL_FACTOR" not in wrapper:
        wrapper = wrapper.replace(MATERIAL_HELPER, MATERIAL_FACTOR + "\n" + MATERIAL_HELPER, 1)
    build_candidate.WRAPPER = wrapper


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
