#!/usr/bin/env python3
"""Build the Veridex Track 2 neural-hybrid candidate.

The build is deliberately reproducible from a pinned, MIT-licensed Telegraph
baseline. We clone the exact upstream commit, rename its primary exports, and
add a thin Veridex factual-integrity layer around the real MiniLM scorer.

The resulting WASM remains standalone and deterministic. No network/filesystem
access is used by the WASM itself; network access exists only in this build
script to obtain the pinned open-source source/weights.
"""
from __future__ import annotations

import argparse
import pathlib
import shutil
import subprocess
import tempfile

BASELINE_REPO = "https://github.com/telegraphprotocol/telegraph-wasm-baseline.git"
BASELINE_COMMIT = "dfa0cf7fda72789267811ba2190f61a8eaacedf6"

WRAPPER = r'''

// Telegraph hosts may invoke alloc/dealloc around every request, but the public
// Wazero checker also exercises modules under a no-dealloc workload. Keep the
// exported input ABI bounded in that environment instead of relying on a host
// reclamation policy. Each scoring call needs at most three simultaneously-live
// input buffers; 16 slots gives ample headroom for sequential host usage while
// keeping the binary comfortably below the 32 MiB platform limit.
const VR_SCRATCH_SLOT: usize = 131072;
const VR_SCRATCH_SLOTS: usize = 16;
static mut VR_SCRATCH: [u8; VR_SCRATCH_SLOT * VR_SCRATCH_SLOTS] =
    [0u8; VR_SCRATCH_SLOT * VR_SCRATCH_SLOTS];
static mut VR_SCRATCH_CURSOR: usize = 0;

#[inline]
fn vr_scratch_range() -> (usize, usize) {
    let start = core::ptr::addr_of!(VR_SCRATCH) as usize;
    (start, start + VR_SCRATCH.len())
}

#[inline]
fn vr_is_scratch_ptr(ptr: i32, size: i32) -> bool {
    if ptr < 0 || size < 0 { return false; }
    let (start, end) = vr_scratch_range();
    let p = ptr as usize;
    let n = size as usize;
    p >= start && p <= end && n <= end.saturating_sub(p)
}

#[no_mangle]
pub unsafe extern "C" fn alloc(size: i32) -> i32 {
    if size <= 0 { return 0; }
    let n = size as usize;
    if n <= VR_SCRATCH_SLOT {
        let slot = VR_SCRATCH_CURSOR % VR_SCRATCH_SLOTS;
        VR_SCRATCH_CURSOR = VR_SCRATCH_CURSOR.wrapping_add(1);
        let base = core::ptr::addr_of_mut!(VR_SCRATCH) as *mut u8;
        return base.add(slot * VR_SCRATCH_SLOT) as i32;
    }
    baseline_alloc(size)
}

#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: i32, size: i32) {
    if vr_is_scratch_ptr(ptr, size) { return; }
    baseline_dealloc(ptr, size);
}

#[inline]
fn vr_lower(b: u8) -> u8 { if b'A' <= b && b <= b'Z' { b + 32 } else { b } }
#[inline]
fn vr_ws(b: u8) -> bool { matches!(b, b' ' | b'\n' | b'\r' | b'\t' | b'\x0b' | b'\x0c') }

fn vr_word_eq(text: &[u8], start: usize, end: usize, needle: &[u8]) -> bool {
    let mut i=start; let mut j=0usize;
    while i<end && j<needle.len() { if vr_lower(text[i]) != vr_lower(needle[j]) { return false; } i+=1; j+=1; }
    i==end && j==needle.len()
}
fn vr_has_word(text: &[u8], needle: &[u8]) -> bool {
    let mut i=0usize;
    while i<text.len() {
        while i<text.len() && !text[i].is_ascii_alphanumeric(){i+=1;}
        let s=i; while i<text.len() && text[i].is_ascii_alphanumeric(){i+=1;}
        if s<i && vr_word_eq(text,s,i,needle){return true;}
    }
    false
}
fn vr_has_any(text:&[u8],words:&[&[u8]])->bool{words.iter().any(|w|vr_has_word(text,w))}

fn vr_is_ignored_entity(word:&[u8])->bool{matches!(word,
 b"The"|b"This"|b"That"|b"These"|b"Those"|b"It"|b"Is"|b"Was"|b"Are"|b"Were"|b"What"|b"Which"|b"When"|b"Where"|b"Who"|b"How"|b"Did"|b"Does"|b"Can"|b"Could"|b"No"|b"Yes"|b"A"|b"An"|b"And"|b"But"|b"Revenue"|b"Loss"|b"Losses"|b"Incidents"|b"Mortality"|b"Treatment"|b"Transfer"|b"Transaction"|b"Platform"|b"Service"|b"Payment"|b"Domain"|b"Website"|b"Report"|b"Result"|b"Number"|b"Rate"|b"Error"|b"FRAUD"|b"SAFE")}

fn vr_named_token_conflict(question:&[u8],ground_truth:&[u8],answer:&[u8])->bool{
    let mut i=0usize;
    while i<answer.len(){
        while i<answer.len() && !answer[i].is_ascii_alphabetic(){i+=1;}
        let s=i; while i<answer.len() && answer[i].is_ascii_alphabetic(){i+=1;}
        if s>=i{continue;}
        let word=&answer[s..i];
        if !word[0].is_ascii_uppercase() || word.len()<3 || vr_is_ignored_entity(word){continue;}
        if !vr_has_word(question,word) && !vr_has_word(ground_truth,word){return true;}
    }
    false
}

fn vr_opposite(gt:&[u8],ans:&[u8])->bool{
    const PAIRS:&[(&[u8],&[u8])]=&[
      (b"fraud",b"safe"),(b"fraudulent",b"legitimate"),(b"scam",b"safe"),(b"malicious",b"benign"),(b"malicious",b"legitimate"),(b"dangerous",b"safe"),(b"harmful",b"safe"),(b"unsafe",b"safe"),(b"phishing",b"legitimate"),(b"positive",b"negative"),(b"bullish",b"bearish"),(b"increase",b"decrease"),(b"increased",b"decreased"),(b"rise",b"fall"),(b"rose",b"fell"),(b"approved",b"rejected"),(b"authorized",b"unauthorized"),(b"confirmed",b"denied"),(b"allowed",b"blocked"),(b"allowed",b"forbidden"),(b"yes",b"no"),(b"true",b"false"),(b"declined",b"increased"),(b"reduced",b"increased"),(b"decreased",b"increased"),(b"lower",b"higher"),(b"down",b"up"),(b"loss",b"gain")];
    for(a,b)in PAIRS{if(vr_has_word(gt,a)&&vr_has_word(ans,b))||(vr_has_word(gt,b)&&vr_has_word(ans,a)){return true;}} false
}

fn vr_first_number(text:&[u8])->Option<(f64,bool)>{
    let mut i=0usize; while i<text.len() && !(text[i].is_ascii_digit()||text[i]==b'.'){i+=1;} if i>=text.len(){return None;}
    let mut x=0.0f64; let mut frac=0.1f64; let mut dot=false; let mut any=false;
    while i<text.len(){let c=text[i]; if c.is_ascii_digit(){any=true;if dot{x+=(c-b'0')as f64*frac;frac*=0.1;}else{x=x*10.0+(c-b'0')as f64;}i+=1;}else if c==b','||c==b'_'{i+=1;}else if c==b'.'&&!dot{dot=true;i+=1;}else{break;}}
    if !any{return None;} while i<text.len()&&vr_ws(text[i]){i+=1;} if i<text.len(){match vr_lower(text[i]){b'k'=>x*=1e3,b'm'=>x*=1e6,b'b'=>x*=1e9,_=>{}}} Some((x,text[i..].first()==Some(&b'%')))
}
fn vr_numeric_mismatch(gt:&[u8],ans:&[u8])->bool{match(vr_first_number(gt),vr_first_number(ans)){(None,None)=>false,(Some((g,gp)),Some((a,ap)))=>{if gp!=ap{return true;}let scale=g.abs().max(a.abs()).max(1.0);(g-a).abs()>scale*0.001+1e-6},_=>true}}
fn vr_question_requires_number(q:&[u8])->bool{(vr_has_word(q,b"how")&&(vr_has_word(q,b"many")||vr_has_word(q,b"much")))||vr_has_word(q,b"amount")||vr_has_word(q,b"value")||vr_has_word(q,b"percentage")||vr_has_word(q,b"percent")}
fn vr_question_is_binary(q:&[u8])->bool{vr_has_any(q,&[b"is",b"are",b"was",b"were",b"did",b"does",b"can",b"could"])}
fn vr_first_binary_polarity(text:&[u8])->Option<bool>{let mut i=0usize;while i<text.len(){while i<text.len()&&!text[i].is_ascii_alphanumeric(){i+=1;}let s=i;while i<text.len()&&text[i].is_ascii_alphanumeric(){i+=1;}if s>=i{continue;}if vr_word_eq(text,s,i,b"yes")||vr_word_eq(text,s,i,b"true"){return Some(true);}if vr_word_eq(text,s,i,b"no")||vr_word_eq(text,s,i,b"false"){return Some(false);}}if vr_has_any(text,&[b"confirmed",b"approved",b"authorized",b"authorised",b"allowed"]){return Some(true);}if vr_has_any(text,&[b"denied",b"rejected",b"unauthorized",b"unauthorised",b"blocked"]){return Some(false);}None}
fn vr_question_guard(q:&[u8],gt:&[u8],ans:&[u8])->f32{let mut g=1.0f32;if vr_question_requires_number(q)&&vr_first_number(ans).is_none(){g*=0.82;}if vr_question_is_binary(q){if let Some(p)=vr_first_binary_polarity(gt){match vr_first_binary_polarity(ans){Some(a)if a!=p=>g*=0.06,None=>g*=0.88,_=>{}}}}g}
fn vr_safe_pow(score:f32)->f32{if score<=0.0{return 0.0;}if score>=1.0{return 1.0;}let y=libm::powf(score,1.18);if y.is_finite(){y.clamp(0.0,1.0)}else{0.0}}

unsafe fn veridex_score(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->(f32,f32,f32,f32){
    let q=read_str(q_ptr,q_len);let gt=read_str(gt_ptr,gt_len);let a=read_str(ma_ptr,ma_len);
    if gt.trim().is_empty()||a.trim().is_empty(){return(0.0,0.0,0.0,0.0);}
    let mut gn=alloc::string::String::new();let mut an=alloc::string::String::new();
    for b in gt.as_bytes(){if b.is_ascii_alphanumeric(){gn.push(vr_lower(*b)as char);}} for b in a.as_bytes(){if b.is_ascii_alphanumeric(){an.push(vr_lower(*b)as char);}}
    if !gn.is_empty()&&gn==an{return(1.0,1.0,1.0,1.0);}
    let mut base=rank_answer_base(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);if !base.is_finite(){return(0.0,0.0,0.0,0.0);}base=base.clamp(0.0,1.0);
    let gb=gt.as_bytes();let ab=a.as_bytes();let fg=if vr_opposite(gb,ab){0.06}else if vr_named_token_conflict(q.as_bytes(),gb,ab){0.08}else if vr_numeric_mismatch(gb,ab){0.22}else{1.0};
    let qg=vr_question_guard(q.as_bytes(),gb,ab);let final_score=vr_safe_pow(base*fg*qg);(final_score,base,fg,qg)
}

static mut VERIDEX_BREAKDOWN:[f32;5]=[0.0;5];
#[no_mangle]pub unsafe extern "C" fn rank_answer(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->f32{veridex_score(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len).0}
#[no_mangle]pub unsafe extern "C" fn breakdown_answer(q_ptr:i32,q_len:i32,gt_ptr:i32,gt_len:i32,ma_ptr:i32,ma_len:i32)->i32{let(f,b,fg,qg)=veridex_score(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);VERIDEX_BREAKDOWN[0]=b;VERIDEX_BREAKDOWN[1]=fg;VERIDEX_BREAKDOWN[2]=qg;VERIDEX_BREAKDOWN[3]=f;VERIDEX_BREAKDOWN[4]=f;core::ptr::addr_of_mut!(VERIDEX_BREAKDOWN) as *mut f32 as i32}
'''


def run(cmd: list[str], cwd: pathlib.Path) -> None:
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    out = pathlib.Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="veridex-neural-") as td:
        root=pathlib.Path(td);upstream=root/"baseline"
        run(["git","clone","--filter=blob:none",BASELINE_REPO,str(upstream)],root)
        run(["git","checkout",BASELINE_COMMIT],upstream)
        lib=upstream/"src"/"lib.rs";text=lib.read_text(encoding="utf-8")
        if "pub unsafe extern \"C\" fn rank_answer(" not in text: raise SystemExit("unexpected baseline lib.rs: rank_answer signature missing")
        if "pub unsafe extern \"C\" fn breakdown_answer(" not in text: raise SystemExit("unexpected baseline lib.rs: breakdown_answer signature missing")
        if "pub unsafe extern \"C\" fn alloc(" not in text: raise SystemExit("unexpected baseline lib.rs: alloc signature missing")
        if "pub unsafe extern \"C\" fn dealloc(" not in text: raise SystemExit("unexpected baseline lib.rs: dealloc signature missing")
        text=text.replace("pub unsafe extern \"C\" fn rank_answer(","pub unsafe extern \"C\" fn rank_answer_base(",1)
        text=text.replace("pub unsafe extern \"C\" fn breakdown_answer(","pub unsafe extern \"C\" fn breakdown_answer_base(",1)
        text=text.replace("pub unsafe extern \"C\" fn alloc(","pub unsafe extern \"C\" fn baseline_alloc(",1)
        text=text.replace("pub unsafe extern \"C\" fn dealloc(","pub unsafe extern \"C\" fn baseline_dealloc(",1)
        lib.write_text(text+WRAPPER,encoding="utf-8")
        run(["rustup","target","add","wasm32-unknown-unknown"],upstream)
        run(["cargo","build","--release","--target","wasm32-unknown-unknown","--features","real_weights"],upstream)
        built=upstream/"target"/"wasm32-unknown-unknown"/"release"/"telegraph_scoring.wasm"
        if not built.exists():raise SystemExit(f"build succeeded but output missing: {built}")
        shutil.copy2(built,out);print(f"upstream commit: {BASELINE_COMMIT}");print(f"output: {out}");print(f"bytes: {out.stat().st_size}")

if __name__=="__main__":main()
