#!/usr/bin/env python3
"""Compatibility entry point for the pinned baseline build.

The official baseline is intentionally kept pinned and otherwise untouched.
This adapter applies only Veridex wrapper compatibility/hardening patches:
- Rust-2024-safe scratch-range sizing
- conservative penalty for binary-answer fragments such as ``No, it``

The upstream repository remains pinned and unmodified on disk until the wrapper
is generated, so provenance remains explicit and reproducible.
"""
from __future__ import annotations

import sys

from build_candidate import main, WRAPPER

OLD_RANGE = "(start, start + VR_SCRATCH.len())"
NEW_RANGE = "(start, start + (VR_SCRATCH_SLOT * VR_SCRATCH_SLOTS))"

OLD_GUARD = """fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}}}g}"""

NEW_GUARD = """fn vr_binary_fragment(ans:&[u8])->bool{if vr_first_binary_polarity(ans).is_none(){return false;}let mut words=0usize;let mut i=0usize;while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphanumeric(){i+=1;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphanumeric(){i+=1;}if s>=i{continue;}words+=1;if words>3{return false;}}words<=3&&(vr_has_word(ans,b\"it\")||vr_has_word(ans,b\"this\")||vr_has_word(ans,b\"that\")||vr_has_word(ans,b\"they\"))}\\nfn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}if vr_binary_fragment(ans){g*=0.35;}}}g}"""

if OLD_RANGE not in WRAPPER:
    raise SystemExit("expected scratch-range expression not found; baseline wrapper changed")
if OLD_GUARD not in WRAPPER:
    raise SystemExit("expected question-guard expression not found; evaluator wrapper changed")

import build_candidate
patched = WRAPPER.replace(OLD_RANGE, NEW_RANGE, 1)
patched = patched.replace(OLD_GUARD, NEW_GUARD, 1)
build_candidate.WRAPPER = patched

if __name__ == "__main__":
    sys.argv[0] = "build_candidate.py"
    main()
