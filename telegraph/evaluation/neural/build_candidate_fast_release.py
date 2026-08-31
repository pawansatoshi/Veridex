#!/usr/bin/env python3
"""Release wrapper for the bounded-performance Track 2 builder.

Runs the established fast builder, then applies the generic binary-question
predicate-consistency guard before the baseline Rust source is written.
"""
from __future__ import annotations

import build_candidate
import build_candidate_fast


_ORIGINAL_CONFLICT = (
    "fn vr_question_predicate_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{"
    "if !vr_question_is_binary(q){return false;}"
    "match(vr_predicate_polarity(gt),vr_predicate_polarity(ans))"
    "{(Some(g),Some(a))=>g!=a,_=>false}}"
)

_GENERIC_CONFLICT = r'''fn vr_question_predicate_polarity(q:&[u8])->Option<bool>{let p=vr_predicate_polarity(q);match p{Some(v)=>{if vr_has_word(q,b"not"){Some(!v)}else{Some(v)}},None=>None}}
fn vr_answer_predicate_polarity(ans:&[u8])->Option<bool>{let p=vr_predicate_polarity(ans);match p{Some(v)=>{if vr_has_word(ans,b"not"){Some(!v)}else{Some(v)}},None=>None}}
fn vr_question_predicate_conflict(q:&[u8],_gt:&[u8],ans:&[u8])->bool{if !vr_question_is_binary(q){return false;}match(vr_question_predicate_polarity(q),vr_answer_predicate_polarity(ans),vr_first_binary_polarity(ans)){(Some(qp),Some(ap),Some(bp))=>{let expected=if bp{qp}else{!qp};ap!=expected},_=>false}}'''


def patch_predicate_logic() -> None:
    build_candidate_fast.patch_semantic_guards()
    if _ORIGINAL_CONFLICT not in build_candidate.WRAPPER:
        raise SystemExit("release wrapper: expected binary predicate guard marker not found")
    build_candidate.WRAPPER = build_candidate.WRAPPER.replace(
        _ORIGINAL_CONFLICT, _GENERIC_CONFLICT, 1
    )


if __name__ == "__main__":
    build_candidate_fast.patch_semantic_guards = patch_predicate_logic
    build_candidate_fast.main()
