#!/usr/bin/env python3
"""Build a hardened Track-2 candidate from the canonical release builder.

This is a reproducible source overlay: it modifies only the release-builder's
embedded deterministic guard strings in memory, then executes the canonical
builder as a real script. The canonical builder, pinned baseline, and release
flow remain otherwise unchanged. No benchmark or evaluator code is modified.
"""
from __future__ import annotations

import runpy
import sys
import tempfile
from pathlib import Path

BASE = Path(__file__).with_name("build_candidate_fast_release.py")

MATERIAL_HELPER = r'''fn vr_release_material_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if vr_has_word(ans,b"opposite") && (vr_has_word(ans,b"conclusion")||vr_has_word(ans,b"result")||vr_has_word(ans,b"final")){return true;}
    if vr_has_word(ans,b"different") && (vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"period")||vr_has_word(ans,b"time")){return true;}
    if vr_has_word(ans,b"another") && (vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"period")||vr_has_word(ans,b"time")){return true;}
    if vr_has_word(gt,b"issued") && vr_has_word(ans,b"received"){return true;}
    if vr_has_word(gt,b"received") && vr_has_word(ans,b"issued"){return true;}
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

GUARD = r'''fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{
    let mut g=1.0f32;
    let entity_conflict=vr_release_entity_conflict(q,gt,ans); if entity_conflict{g*=0.02;}
    let numeric_equiv=vr_release_numeric_equivalent(q,gt,ans); let complete_numeric=vr_release_unit_completeness(q,gt,ans);
    if numeric_equiv&&!entity_conflict&&complete_numeric{g=1.0;} else if numeric_equiv&&!complete_numeric{g*=0.62;} else if vr_numeric_context(q){
        match(vr_first_number(gt),vr_first_number(ans)){(Some(_),Some(_))=>g*=0.05,(Some(_),None)=>g*=0.65,_=>{}}
    } else {
        let gt_has_num=vr_first_number(gt).is_some(); let ans_has_num=vr_first_number(ans).is_some();
        if !gt_has_num&&ans_has_num{g*=0.90;}
    }
    if vr_question_is_binary(q){
        if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}}
        if vr_question_predicate_conflict(q,gt,ans){g*=0.06;}
        if vr_release_binary_fragment(ans){g*=0.20;}
    }
    if vr_release_negation_conflict(gt,ans){g*=0.05;}
    if vr_release_tail_contamination(ans){g*=0.05;}
    if vr_release_material_conflict(q,gt,ans){g*=0.05;}
    g
}'''


def replace_assignment(src: str, name: str, replacement: str) -> str:
    marker = name + " = r'''"
    start = src.find(marker)
    if start < 0:
        raise RuntimeError(f"release overlay: assignment marker not found: {name}")
    value_start = start + len(marker)
    end = src.find("'''", value_start)
    if end < 0:
        raise RuntimeError(f"release overlay: unterminated assignment: {name}")
    return src[:value_start] + replacement + src[end:]


def add_helper(src: str, helper: str) -> str:
    marker = "_RELEASE_GUARD = r'''"
    pos = src.find(marker)
    if pos < 0:
        raise RuntimeError("release overlay: guard marker not found")
    return src[:pos] + "_RELEASE_MATERIAL = r'''" + helper + "'''\n\n" + src[pos:]


def main() -> int:
    source = BASE.read_text(encoding="utf-8")
    source = add_helper(source, MATERIAL_HELPER)
    source = replace_assignment(source, "_RELEASE_GUARD", GUARD)
    # The guard references vr_release_material_conflict, so inject the helper
    # into the Rust wrapper immediately before the question guard function.
    helper_insert = "if \"fn vr_release_material_conflict(\" not in wrapper:"
    if helper_insert not in source:
        raise RuntimeError("release overlay: expected wrapper helper insertion anchor not found")
    # Make the canonical patch_release_guards function prepend our helper after
    # its own fast patching and before replacing the release question guard.
    source = source.replace(
        helper_insert,
        "if \"fn vr_release_material_conflict(\" not in wrapper:\n        _helper = _RELEASE_MATERIAL + \"\\n\"\n        anchor = wrapper.find(\"fn vr_question_guard(\")\n        if anchor < 0: raise SystemExit(\"release overlay: question guard marker not found\")\n        wrapper = wrapper[:anchor] + _helper + wrapper[anchor:]\n    " + helper_insert,
        1,
    )
    # Execute the modified canonical release builder as a script so its exact
    # normal entrypoint and build path are preserved.
    with tempfile.NamedTemporaryFile("w", suffix="_build_candidate_fast_release.py", encoding="utf-8", delete=False) as tmp:
        tmp.write(source)
        tmp_path = Path(tmp.name)
    sys.path.insert(0, str(BASE.parent))
    try:
        runpy.run_path(str(tmp_path), run_name="__main__")
    finally:
        tmp_path.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
