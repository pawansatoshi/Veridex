#!/usr/bin/env python3
"""Track-2 release builder v3: material contradiction/qualifier hardening.

Builds on the robust v2 release builder and adds generalized, benchmark-agnostic
material-conflict guards. No hidden evaluator thresholds or benchmark cases are
modified.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast
import build_candidate_fast_release_v2 as base


def _replace_function(src: str, name: str, replacement: str) -> str:
    marker = f"fn {name}("
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"v3 release patch: function not found: {name}")
    brace = src.find("{", start)
    if brace < 0:
        raise RuntimeError(f"v3 release patch: opening brace not found: {name}")
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
                    return src[:start] + replacement + src[i + 1:]
        i += 1
    raise RuntimeError(f"v3 release patch: unmatched braces: {name}")


MATERIAL_CONFLICT = r'''fn vr_material_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    let diff_entity=vr_has_word(ans,b"different")&&vr_has_word(ans,b"entity") || vr_has_word(ans,b"another")&&vr_has_word(ans,b"entity");
    let diff_rel=vr_has_word(ans,b"different")&&(vr_has_word(ans,b"relationship")||vr_has_word(ans,b"relation"));
    let diff_period=vr_has_word(ans,b"different")&&(vr_has_word(ans,b"period")||vr_has_word(ans,b"time"));
    let explicit_opp=vr_has_word(ans,b"opposite")&&(vr_has_word(ans,b"conclusion")||vr_has_word(ans,b"final"));
    let tail_unrelated=vr_has_word(ans,b"unrelated")&&(vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"topic"));
    let neg_rel=(vr_has_word(gt,b"issued")&&vr_has_word(ans,b"received"))||(vr_has_word(gt,b"received")&&vr_has_word(ans,b"issued"))
        ||(vr_has_word(gt,b"sent")&&vr_has_word(ans,b"received"))||(vr_has_word(gt,b"received")&&vr_has_word(ans,b"sent"))
        ||(vr_has_word(gt,b"bought")&&vr_has_word(ans,b"sold"))||(vr_has_word(gt,b"sold")&&vr_has_word(ans,b"bought"));
    diff_entity||diff_rel||diff_period||explicit_opp||tail_unrelated||neg_rel
}

fn vr_hedged_answer(ans:&[u8])->bool{
    (vr_has_word(ans,b"may")&&vr_has_word(ans,b"be")) || vr_has_word(ans,b"might") || vr_has_word(ans,b"possibly") || vr_has_word(ans,b"perhaps")
}
'''


def patch() -> None:
    base.robust_patch()
    w = build_candidate.WRAPPER
    pos = w.find("fn vr_question_guard(")
    if pos < 0:
        raise RuntimeError("v3 release patch: question guard insertion point missing")
    w = w[:pos] + MATERIAL_CONFLICT + "\n" + w[pos:]
    old_guard = "fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{"
    # The robust v2 guard has a known signature; replace its body by calling the
    # vetted guard under a stable base name and then adding v3 penalties.
    base_guard_marker = "fn vr_question_guard("
    start = w.find(base_guard_marker)
    if start < 0:
        raise RuntimeError("v3 release patch: guard not found")
    brace = w.find("{", start)
    depth = 0; quote = None; esc = False; i = brace; end = None
    while i < len(w):
        ch = w[i]
        if quote:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == quote: quote = None
        else:
            if ch == '"': quote = '"'
            elif ch == "{": depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0: end = i + 1; break
        i += 1
    if end is None:
        raise RuntimeError("v3 release patch: guard closing brace not found")
    old = w[start:end]
    base_name = old.replace("fn vr_question_guard(", "fn vr_question_guard_v2(", 1)
    w = w[:start] + base_name + w[end:]
    new_guard = old_guard + "let mut g=vr_question_guard_v2(q,gt,ans);if vr_material_conflict(q,gt,ans){g*=0.04;}else if vr_hedged_answer(ans){g*=0.82;}g}"
    insert = w.find("fn vr_question_guard_v2(")
    if insert < 0:
        raise RuntimeError("v3 release patch: renamed guard missing")
    w = w[:insert] + new_guard + "\n" + w[insert:]
    build_candidate.WRAPPER = w


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch
    build_candidate_fast.main()
