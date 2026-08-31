#!/usr/bin/env python3
"""Build the bounded-performance Veridex Track 2 neural candidate."""
from __future__ import annotations

import argparse
import pathlib
import re
import shutil
import subprocess
import tempfile

import build_candidate
import build_candidate_compat

BASELINE_REPO = build_candidate.BASELINE_REPO
BASELINE_COMMIT = build_candidate.BASELINE_COMMIT


def patch_semantic_guards() -> None:
    """Extend wrapper guards for directional, numeric, and equivalence forms."""
    old_opposite = '''fn vr_opposite(gt:&[u8],ans:&[u8])->bool{
    const PAIRS:&[(&[u8],&[u8])]=&[
      (b"fraud",b"safe"),(b"fraudulent",b"legitimate"),(b"scam",b"safe"),(b"malicious",b"benign"),(b"malicious",b"legitimate"),(b"dangerous",b"safe"),(b"harmful",b"safe"),(b"unsafe",b"safe"),(b"phishing",b"legitimate"),(b"positive",b"negative"),(b"bullish",b"bearish"),(b"increase",b"decrease"),(b"increased",b"decreased"),(b"rise",b"fall"),(b"rose",b"fell"),(b"approved",b"rejected"),(b"authorized",b"unauthorized"),(b"confirmed",b"denied"),(b"allowed",b"blocked"),(b"allowed",b"forbidden"),(b"yes",b"no"),(b"true",b"false"),(b"declined",b"increased"),(b"reduced",b"increased"),(b"decreased",b"increased"),(b"lower",b"higher"),(b"down",b"up"),(b"loss",b"gain")];
    for(a,b)in PAIRS{if(vr_has_word(gt,a)&&vr_has_word(ans,b))||(vr_has_word(gt,b)&&vr_has_word(ans,a)){return true;}} false
}'''
    new_opposite = '''fn vr_direction(text:&[u8])->Option<bool>{
    const UP:&[&[u8]]=&[b"increase",b"increased",b"rise",b"rose",b"rising",b"up",b"higher",b"gain",b"gained"];
    const DOWN:&[&[u8]]=&[b"decrease",b"decreased",b"fall",b"fell",b"falling",b"down",b"lower",b"loss",b"lost",b"declined",b"reduced",b"dropped"];
    let up=vr_has_any(text,UP);let down=vr_has_any(text,DOWN);match(up,down){(true,false)=>Some(true),(false,true)=>Some(false),_=>None}
}
fn vr_opposite(gt:&[u8],ans:&[u8])->bool{
    const PAIRS:&[(&[u8],&[u8])]=&[
      (b"fraud",b"safe"),(b"fraudulent",b"legitimate"),(b"scam",b"safe"),(b"malicious",b"benign"),(b"malicious",b"legitimate"),(b"dangerous",b"safe"),(b"harmful",b"safe"),(b"unsafe",b"safe"),(b"phishing",b"legitimate"),(b"positive",b"negative"),(b"bullish",b"bearish"),(b"increase",b"decrease"),(b"increased",b"decreased"),(b"rise",b"fall"),(b"rose",b"fell"),(b"approved",b"rejected"),(b"authorized",b"unauthorized"),(b"confirmed",b"denied"),(b"allowed",b"blocked"),(b"allowed",b"forbidden"),(b"yes",b"no"),(b"true",b"false"),(b"declined",b"increased"),(b"reduced",b"increased"),(b"decreased",b"increased"),(b"lower",b"higher"),(b"down",b"up"),(b"loss",b"gain")];
    for(a,b)in PAIRS{if(vr_has_word(gt,a)&&vr_has_word(ans,b))||(vr_has_word(gt,b)&&vr_has_word(ans,a)){return true;}}
    match(vr_direction(gt),vr_direction(ans)){(Some(g),Some(a))=>g!=a,_=>false}
}'''
    old_number = '''fn vr_first_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize; while i<text.len() && !(text[i].is_ascii_digit()||text[i]==b'.'){i+=1;} if i>=text.len(){return None;}
    let mut x=0.0f64; let mut frac=0.1f64; let mut dot=false; let mut any=false;
    while i<text.len(){let c=text[i]; if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}else if c==b','||c==b'_'{i+=1;}else if c==b'.'&&!dot{dot=true;i+=1;}else{break;}}
    if !any{return None;} while i<text.len()&&vr_ws(text[i]){i+=1;} if i<text.len(){match vr_lower(text[i]){b'k'=>x*=1e3,b'm'=>x*=1e6,b'b'=>x*=1e9,_=>{}}} Some((x,text[i..].first()==Some(&b'%')))
}'''
    new_number = '''fn vr_first_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize; while i<text.len() && !text[i].is_ascii_digit(){i+=1;} if i>=text.len(){return None;}
    let mut x=0.0f64; let mut frac=0.1f64; let mut dot=false; let mut any=false;
    while i<text.len(){let c=text[i]; if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}else if c==b','||c==b'_'{i+=1;}else if c==b'.'&&!dot&&i+1<text.len()&&text[i+1].is_ascii_digit(){dot=true;i+=1;}else{break;}}
    if !any{return None;}
    while i<text.len()&&vr_ws(text[i]){i+=1;}
    let mut scaled=false;
    if i<text.len(){match vr_lower(text[i]){b'k'|b'm'|b'b' if i+1==text.len()||!text[i+1].is_ascii_alphabetic()=>{match vr_lower(text[i]){b'k'=>x*=1e3,b'm'=>x*=1e6,b'b'=>x*=1e9,_=>{}}scaled=true;},_=>{}}}
    if !scaled{if vr_has_word(text,b"thousand"){x*=1e3;}else if vr_has_word(text,b"million"){x*=1e6;}else if vr_has_word(text,b"billion"){x*=1e9;}}
    Some((x,vr_has_word(text,b"percent")||vr_has_word(text,b"percentage")||text[i..].first()==Some(&b'%')))
}'''
    for old,new,label in ((old_opposite,new_opposite,"directional guard"),(old_number,new_number,"numeric parser")):
        if old not in build_candidate.WRAPPER:
            raise SystemExit(f"fast path: expected {label} marker not found")
        build_candidate.WRAPPER=build_candidate.WRAPPER.replace(old,new,1)

    eq_helper = '''fn vr_explicit_equivalence(text:&[u8])->bool{let direct=vr_has_word(text,b"equivalent")||vr_has_word(text,b"identical");let same=vr_has_word(text,b"same")&&(vr_has_word(text,b"value")||vr_has_word(text,b"answer")||vr_has_word(text,b"amount")||vr_has_word(text,b"number"));(direct||same)&&!vr_has_any(text,&[b"not",b"different",b"wrong",b"incorrect"])}
fn vr_safe_numeric_equiv(gt:&[u8],ans:&[u8])->bool{match(vr_first_number(gt),vr_first_number(ans)){(Some((g,gp)),Some((a,ap)))=>{if gp!=ap{return false;}let scale=g.abs().max(a.abs()).max(1.0);(g-a).abs()<=scale*1e-9},_=>false}}
fn vr_numeric_context(q:&[u8])->bool{const TERMS:&[&[u8]]=&[b"amount",b"value",b"loss",b"profit",b"revenue",b"cost",b"price",b"fee",b"number",b"total",b"volume",b"rate",b"percentage",b"percent",b"worth",b"valuation",b"supply",b"balance",b"quantity"];vr_has_any(q,TERMS)}
'''
    marker="unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){"
    if marker not in build_candidate.WRAPPER:
        raise SystemExit("fast path: score function marker not found")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(marker,eq_helper+marker,1)

    score_marker="let gb=gt.as_bytes();let ab=a.as_bytes();let fg="
    score_inject=(
        "let gb=gt.as_bytes();let ab=a.as_bytes();"
        "let safe_numeric_equiv=vr_safe_numeric_equiv(gb,ab)&&vr_numeric_context(q.as_bytes())&&!vr_opposite(gb,ab)&&!vr_named_token_conflict(q.as_bytes(),gb,ab);"
        "let numeric_mismatch=vr_numeric_mismatch(gb,ab)&&!safe_numeric_equiv;"
        "let fg=if vr_opposite(gb,ab){0.06}else if vr_named_token_conflict(q.as_bytes(),gb,ab){0.08}else if numeric_mismatch{0.08}else{1.0};"
    )
    if score_marker not in build_candidate.WRAPPER:
        raise SystemExit("fast path: score guard insertion marker not found")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(score_marker,score_inject,1)

    sharpen_marker="let qg=vr_question_guard(q.as_bytes(),gb,ab);let final_score=vr_safe_pow(base*fg*qg);(final_score,base,fg,qg)"
    sharpen_replacement=(
        "let qg=vr_question_guard(q.as_bytes(),gb,ab);"
        "if safe_numeric_equiv{let lifted=vr_safe_pow(base.max(0.95));return(lifted,base,1.0,qg);}"
        "let mut final_score=vr_safe_pow(base*fg*qg);"
        "if numeric_mismatch{final_score=final_score.min(0.30);}(final_score,base,fg,qg)"
    )
    if sharpen_marker not in build_candidate.WRAPPER:
        raise SystemExit("fast path: final-score marker not found")
    build_candidate.WRAPPER=build_candidate.WRAPPER.replace(sharpen_marker,sharpen_replacement,1)


def run(cmd: list[str], cwd: pathlib.Path) -> None:
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def patch_fast_sources(upstream: pathlib.Path) -> None:
    tokenizer=upstream/"src"/"tokenizer.rs"
    text=tokenizer.read_text(encoding="utf-8")
    text,n=re.subn(r"pub\s+const\s+MAX_SEQ_LEN\s*:\s*usize\s*=\s*\d+\s*;","pub const MAX_SEQ_LEN: usize = 64;",text,count=1)
    if n!=1: raise SystemExit("fast path: MAX_SEQ_LEN definition not found")
    tokenizer.write_text(text,encoding="utf-8")
    embed=upstream/"src"/"embed.rs"
    text=embed.read_text(encoding="utf-8")
    text,n=re.subn(r"let\s+num_layers\s*=\s*read_u32\(w,\s*&mut\s*c\)\s+as\s+usize\s*;","let num_layers = core::cmp::min(read_u32(w, &mut c) as usize, 5);",text,count=1)
    if n!=1: raise SystemExit("fast path: transformer layer-count definition not found")
    text,n=re.subn(r"assert_eq!\(\s*num_positions,\s*MAX_SEQ_LEN,\s*\n?\s*\"weights\.bin position table size doesn't match tokenizer::MAX_SEQ_LEN\"\s*\n?\s*\);",'assert!(num_positions >= MAX_SEQ_LEN, "weights.bin position table is shorter than tokenizer::MAX_SEQ_LEN");',text,count=1)
    if n!=1: raise SystemExit("fast path: position-table assertion not found")
    embed.write_text(text,encoding="utf-8")


def main() -> None:
    ap=argparse.ArgumentParser();ap.add_argument("--out",required=True);args=ap.parse_args()
    out=pathlib.Path(args.out).resolve();out.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="veridex-neural-fast-") as td:
        root=pathlib.Path(td);upstream=root/"baseline"
        run(["git","clone","--filter=blob:none",BASELINE_REPO,str(upstream)],root)
        run(["git","checkout",BASELINE_COMMIT],upstream)
        patch_semantic_guards();patch_fast_sources(upstream)
        lib=upstream/"src"/"lib.rs";text=lib.read_text(encoding="utf-8")
        replacements=(
            ('pub unsafe extern "C" fn rank_answer(', 'pub unsafe extern "C" fn rank_answer_base('),
            ('pub unsafe extern "C" fn breakdown_answer(', 'pub unsafe extern "C" fn breakdown_answer_base('),
            ('pub unsafe extern "C" fn alloc(', 'pub unsafe extern "C" fn baseline_alloc('),
            ('pub unsafe extern "C" fn dealloc(', 'pub unsafe extern "C" fn baseline_dealloc('),
        )
        for old,new in replacements:
            if old not in text: raise SystemExit(f"unexpected pinned baseline lib.rs: missing {old}")
            text=text.replace(old,new,1)
        lib.write_text(text+build_candidate.WRAPPER,encoding="utf-8")
        run(["rustup","target","add","wasm32-unknown-unknown"],upstream)
        run(["cargo","build","--release","--target","wasm32-unknown-unknown","--features","real_weights"],upstream)
        built=upstream/"target"/"wasm32-unknown-unknown"/"release"/"telegraph_scoring.wasm"
        if not built.exists(): raise SystemExit(f"build succeeded but output missing: {built}")
        shutil.copy2(built,out)
        print(f"upstream commit: {BASELINE_COMMIT}")
        print("fast path: MAX_SEQ_LEN=64, max transformer layers=5")
        print("semantic guards: directional polarity + robust numeric parsing + factual equivalence")
        print("numeric equivalence: exact normalized numeric equality with 1e-9 relative floating tolerance")
        print("numeric mismatch: score-factor 0.08 and final score cap 0.30")
        print(f"output: {out}")
        print(f"bytes: {out.stat().st_size}")

if __name__ == "__main__":
    main()
