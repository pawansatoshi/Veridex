#!/usr/bin/env python3
"""Track-2 release builder v2 compatibility layer.

Reuses the proven release builder and adds a conservative, generalized
material-conflict layer for explicit qualifier/relation/late-contradiction
patterns. It does not alter evaluator gates or hard-code benchmark questions.
"""
from __future__ import annotations

import build_candidate_fast_release as base

MATERIAL_CONFLICT = r'''fn vr_release_material_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    // Explicit discourse-level contradiction/qualification markers.
    if vr_has_word(ans,b"opposite") && (vr_has_word(ans,b"conclusion")||vr_has_word(ans,b"result")||vr_has_word(ans,b"final")){return true;}
    if vr_has_word(ans,b"different") && (vr_has_word(ans,b"entity")||vr_has_word(ans,b"relationship")||vr_has_word(ans,b"period")||vr_has_word(ans,b"time")){return true;}
    // Common relation reversals: same topic/entity, opposite relationship.
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
    let material_conflict=vr_release_material_conflict(q,gt,ans); if material_conflict{g*=0.05;}
    let entity_conflict=vr_release_entity_conflict(q,gt,ans); if entity_conflict{g*=0.02;}
    let numeric_equiv=vr_release_numeric_equivalent(q,gt,ans); let complete_numeric=vr_release_unit_completeness(q,gt,ans);
    if numeric_equiv&&!entity_conflict&&complete_numeric{g=1.0;} else if numeric_equiv&&!complete_numeric{g*=0.62;} else if vr_numeric_context(q){
        match(vr_first_number(gt),vr_first_number(ans)){(Some(_),Some(_))=>g*=0.05,(Some(_),None)=>g*=0.65,_=>{}}
    } else {
        // Mildly discount unsupported numeric additions in non-numeric factual answers.
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
    g
}'''

SCORE = r'''unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}
    let mut gn=alloc::string::String::new();let mut an=alloc::string::String::new();
    for b in gt.as_bytes(){if b.is_ascii_alphanumeric(){gn.push(vr_lower(*b)as char);}}
    for b in a.as_bytes(){if b.is_ascii_alphanumeric(){an.push(vr_lower(*b)as char);}}
    if !gn.is_empty()&&gn==an{return(1.0,1.0,1.0,1.0);}
    let mut base=rank_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len); if !base.is_finite(){return(0.0,0.0,0.0,0.0);}
    base=base.clamp(0.0,1.0); let gb=gt.as_bytes();let ab=a.as_bytes();
    let numeric_pair=(vr_first_number(gb),vr_first_number(ab));
    let numeric_equivalent=match numeric_pair{(Some((g,gp)),Some((a,ap)))=>gp==ap&&(g-a).abs()<=g.abs().max(a.abs()).max(1.0)*1e-9&&vr_numeric_context(q.as_bytes())&&!vr_opposite(gb,ab)&&!vr_named_token_conflict(q.as_bytes(),gb,ab),_=>false};
    let numeric_complete=vr_release_unit_completeness(q.as_bytes(),gb,ab);
    let safe_numeric_equiv=numeric_equivalent&&numeric_complete;
    let incomplete_numeric_equiv=numeric_equivalent&&!numeric_complete;
    let numeric_mismatch_strict=vr_numeric_context(q.as_bytes())&&match numeric_pair{(Some(_),Some(_))=>!numeric_equivalent,_=>false};
    let material_conflict=vr_release_material_conflict(q.as_bytes(),gb,ab);
    let fg=if material_conflict{0.05}else if vr_opposite(gb,ab){0.06}else if vr_named_token_conflict(q.as_bytes(),gb,ab){0.08}else if numeric_mismatch_strict{0.08}else{1.0};
    let qg=vr_question_guard(q.as_bytes(),gb,ab); let shaped_base=if safe_numeric_equiv{base.max(0.95)}else{base};
    let mut final_score=vr_safe_pow(shaped_base*fg*qg);
    if incomplete_numeric_equiv{final_score=final_score.min(0.74);} if numeric_mismatch_strict{final_score=final_score.min(0.30);}
    (final_score,base,fg,qg)
}'''

EXTRA_FUNCTIONS = MATERIAL_CONFLICT


def main() -> None:
    # First apply the proven release patch set unchanged.
    base.patch_release_guards()
    wrapper = base.build_candidate.WRAPPER
    if "fn vr_release_material_conflict(" not in wrapper:
        pos = wrapper.find("fn vr_question_guard(")
        if pos < 0:
            raise SystemExit("release v2: question guard marker not found")
        wrapper = wrapper[:pos] + EXTRA_FUNCTIONS + "\n" + wrapper[pos:]
    wrapper = base._replace_function(wrapper, "fn vr_question_guard(", GUARD)
    wrapper = base._replace_function(wrapper, "unsafe fn veridix_score(", SCORE) if "unsafe fn veridix_score(" in wrapper else base._replace_function(wrapper, "unsafe fn veridex_score(", SCORE)
    base.build_candidate.WRAPPER = wrapper
    base.build_candidate_fast.main()


if __name__ == "__main__":
    main()
