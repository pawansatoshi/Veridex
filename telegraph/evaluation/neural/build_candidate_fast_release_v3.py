#!/usr/bin/env python3
"""Track-2 release builder v3: final-path factual conflict hardening.

Builds on the robust v2 release builder. Material contradictions, relation
reversals and unsupported qualifiers are applied directly in veridex_score so
neural similarity cannot wash out an obvious factual conflict.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release_v2 as base


def _replace_function(src: str, marker: str, replacement: str) -> str:
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"v3 patch: function marker not found: {marker}")
    brace = src.find("{", start)
    if brace < 0:
        raise RuntimeError(f"v3 patch: opening brace not found: {marker}")
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
    raise RuntimeError(f"v3 patch: unmatched braces: {marker}")


MATERIAL = r'''const VR_MATERIAL_FACTOR:f32=0.04;
const VR_MATERIAL_CAP:f32=0.20;
fn vr_material_conflict_factor(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let unsupported_entity=(vr_has_word(ans,b"different")&&vr_has_word(ans,b"entity")||vr_has_word(ans,b"another")&&vr_has_word(ans,b"entity"))
        &&!(vr_has_word(gt,b"different")&&vr_has_word(gt,b"entity")||vr_has_word(gt,b"another")&&vr_has_word(gt,b"entity"));
    let unsupported_relation=(vr_has_word(ans,b"different")&&(vr_has_word(ans,b"relationship")||vr_has_word(ans,b"relation")))
        &&!(vr_has_word(gt,b"different")&&(vr_has_word(gt,b"relationship")||vr_has_word(gt,b"relation")));
    let unsupported_period=(vr_has_word(ans,b"different")&&(vr_has_word(ans,b"period")||vr_has_word(ans,b"time")))
        &&!(vr_has_word(gt,b"different")&&(vr_has_word(gt,b"period")||vr_has_word(gt,b"time")));
    let explicit_opposite=vr_has_word(ans,b"opposite")&&(vr_has_word(ans,b"conclusion")||vr_has_word(ans,b"final"))
        &&!(vr_has_word(gt,b"opposite")&&(vr_has_word(gt,b"conclusion")||vr_has_word(gt,b"final")));
    let unsupported_unrelated=vr_has_word(ans,b"unrelated")
        &&(vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"topic"))
        &&!vr_has_word(gt,b"unrelated");
    let relation_reverse=(vr_has_word(gt,b"issued")&&vr_has_word(ans,b"received"))
        ||(vr_has_word(gt,b"received")&&vr_has_word(ans,b"issued"))
        ||(vr_has_word(gt,b"sent")&&vr_has_word(ans,b"received"))
        ||(vr_has_word(gt,b"received")&&vr_has_word(ans,b"sent"))
        ||(vr_has_word(gt,b"bought")&&vr_has_word(ans,b"sold"))
        ||(vr_has_word(gt,b"sold")&&vr_has_word(ans,b"bought"));
    if unsupported_entity||unsupported_relation||unsupported_period||explicit_opposite||unsupported_unrelated||relation_reverse{VR_MATERIAL_FACTOR}else{1.0}
}
'''


def patch() -> None:
    base.robust_patch()
    w = build_candidate.WRAPPER
    marker = "unsafe fn veridex_score("
    pos = w.find(marker)
    if pos < 0:
        raise RuntimeError("v3 patch: veridex_score marker not found")
    w = w[:pos] + MATERIAL + "\n" + w[pos:]

    start = w.find(marker)
    brace = w.find("{", start)
    depth = 0
    quote = None
    escaped = False
    i = brace
    end = None
    while i < len(w):
        ch = w[i]
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
                    end = i + 1
                    break
        i += 1
    if end is None:
        raise RuntimeError("v3 patch: veridex_score closing brace not found")

    score = w[start:end]
    if "let q=read_str(" not in score or "let qg=vr_question_guard(" not in score:
        raise RuntimeError("v3 patch: unexpected score implementation")

    needle = "let qg=vr_question_guard(q.as_bytes(),gb,ab);"
    if needle not in score:
        raise RuntimeError("v3 patch: question-guard score anchor not found")
    score = score.replace(
        needle,
        needle + "let material=vr_material_conflict_factor(q.as_bytes(),gb,ab);",
        1,
    )
    score = score.replace(
        "let mut final_score=vr_safe_pow(shaped_base*fg*qg);",
        "let mut final_score=vr_safe_pow(shaped_base*fg*qg*material);",
        1,
    )
    score = score.replace(
        "if numeric_mismatch_strict{final_score=final_score.min(0.30);}",
        "if numeric_mismatch_strict{final_score=final_score.min(0.30);}if material<1.0{final_score=final_score.min(VR_MATERIAL_CAP);}",
        1,
    )
    w = w[:start] + score + w[end:]
    build_candidate.WRAPPER = w


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
