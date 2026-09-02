#!/usr/bin/env python3
"""Reproducible final Track-2 R5 build with one last defensive source patch."""
from __future__ import annotations
import build_candidate
import build_candidate_fast
import build_candidate_fast_release

_BASE_PATCH = build_candidate_fast_release.patch_release_guards

_R5_COMMON_CAP = r'''fn vr_r5_common_cap(w:&[u8])->bool{matches!(w,
 b"Answer"|b"According"|b"Provided"|b"Information"|b"Based"|b"Result"|b"Response"|b"Note"|b"For"|b"From"|b"The"|b"This"|b"That"|b"These"|b"Those"|b"It"|b"Its"|b"Yes"|b"No")}
'''
_R5_ENTITY = r'''fn vr_r5_entity_anchor(text:&[u8])->bool{
    let mut i=0usize; while i<text.len(){while i<text.len()&&!text[i].is_ascii_alphabetic(){i+=1;}let s=i;while i<text.len()&&text[i].is_ascii_alphabetic(){i+=1;}if s>=i{continue;}let w=&text[s..i];let tc=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());if tc&&!vr_is_ignored_entity(w)&&!vr_r5_common_cap(w){return true;}}
    false
}
fn vr_r5_entity_conflict(q:&[u8],gt:&[u8],ans:&[u8])->bool{
    if !vr_r5_entity_anchor(gt){return false;}
    let mut i=0usize; while i<ans.len(){while i<ans.len()&&!ans[i].is_ascii_alphabetic(){i+=1;}let s=i;while i<ans.len()&&ans[i].is_ascii_alphabetic(){i+=1;}if s>=i{continue;}let w=&ans[s..i];let tc=w.len()>=3&&w[0].is_ascii_uppercase()&&w[1..].iter().any(|b|b.is_ascii_lowercase());if tc&&!vr_is_ignored_entity(w)&&!vr_r5_common_cap(w)&&!vr_has_word(q,w)&&!vr_has_word(gt,w){return true;}}
    false
}'''

def replace_function(wrapper: str, marker: str, replacement: str) -> str:
    start=wrapper.find(marker)
    if start<0: raise SystemExit(f"r5 patch: missing {marker}")
    depth=0; quote=False; esc=False
    for i in range(start,len(wrapper)):
        ch=wrapper[i]
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch=='"': quote=False
        else:
            if ch=='"': quote=True
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0: return wrapper[:start]+replacement+wrapper[i+1:]
    raise SystemExit('r5 patch: unterminated function')

def patch()->None:
    _BASE_PATCH()
    b=build_candidate.WRAPPER
    b=_R5_COMMON_CAP+"\n"+b
    b=replace_function(b,"fn vr_r5_entity_anchor(",_R5_ENTITY.split("\nfn vr_r5_entity_conflict",1)[0])
    b=replace_function(b,"fn vr_r5_entity_conflict(","fn vr_r5_entity_conflict"+_R5_ENTITY.split("fn vr_r5_entity_conflict",1)[1])
    build_candidate.WRAPPER=b

if __name__=="__main__":
    build_candidate_fast.patch_semantic_guards=patch
    build_candidate_fast.main()
