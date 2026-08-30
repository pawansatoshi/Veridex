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
import re
import shutil
import subprocess
import tempfile

BASELINE_REPO = "https://github.com/telegraphprotocol/telegraph-wasm-baseline.git"
BASELINE_COMMIT = "dfa0cf7fda72789267811ba2190f61a8eaacedf6"

WRAPPER = r'''

// ─────────────────────────────────────────────────────────────────────────────
// Veridex factual-integrity wrapper
// ─────────────────────────────────────────────────────────────────────────────
// The upstream semantic scorer supplies the primary semantic signal. Veridex
// adds low-cost deterministic guards for the failure modes most dangerous in
// fraud/security answers: polarity inversion, numeric mismatch, and obvious
// answer-shape violations. A gentle monotone power transform improves score
// separation without changing order between unguarded pairs.

#[inline]
fn vr_lower(b: u8) -> u8 {
    if b'A' <= b && b <= b'Z' { b + 32 } else { b }
}

#[inline]
fn vr_ws(b: u8) -> bool {
    matches!(b, b' ' | b'\n' | b'\r' | b'\t' | b'\x0b' | b'\x0c')
}

fn vr_word_eq(text: &[u8], start: usize, end: usize, needle: &[u8]) -> bool {
    let mut i = start;
    let mut j = 0usize;
    while i < end && j < needle.len() {
        if vr_lower(text[i]) != needle[j] { return false; }
        i += 1; j += 1;
    }
    i == end && j == needle.len()
}

fn vr_has_word(text: &[u8], needle: &[u8]) -> bool {
    let mut i = 0usize;
    while i < text.len() {
        while i < text.len() && !text[i].is_ascii_alphanumeric() { i += 1; }
        let s = i;
        while i < text.len() && text[i].is_ascii_alphanumeric() { i += 1; }
        if s < i && vr_word_eq(text, s, i, needle) { return true; }
    }
    false
}

fn vr_has_any(text: &[u8], words: &[&[u8]]) -> bool {
    words.iter().any(|w| vr_has_word(text, w))
}

fn vr_opposite(gt: &[u8], ans: &[u8]) -> bool {
    const PAIRS: &[(&[u8], &[u8])] = &[
        (b"fraud", b"safe"), (b"fraudulent", b"legitimate"),
        (b"scam", b"safe"), (b"malicious", b"benign"),
        (b"phishing", b"legitimate"), (b"positive", b"negative"),
        (b"bullish", b"bearish"), (b"increase", b"decrease"),
        (b"increased", b"decreased"), (b"rise", b"fall"),
        (b"rose", b"fell"), (b"approved", b"rejected"),
        (b"authorized", b"unauthorized"), (b"confirmed", b"denied"),
        (b"allowed", b"blocked"), (b"allowed", b"forbidden"),
        (b"yes", b"no"), (b"true", b"false"),
    ];
    for (a, b) in PAIRS {
        if (vr_has_word(gt, a) && vr_has_word(ans, b))
            || (vr_has_word(gt, b) && vr_has_word(ans, a)) {
            return true;
        }
    }
    false
}

fn vr_first_number(text: &[u8]) -> Option<(f64, bool)> {
    let mut i = 0usize;
    while i < text.len() && !(text[i].is_ascii_digit() || text[i] == b'.') { i += 1; }
    if i >= text.len() { return None; }
    let mut x = 0.0f64;
    let mut frac = 0.1f64;
    let mut dot = false;
    let mut any = false;
    while i < text.len() {
        let c = text[i];
        if c.is_ascii_digit() {
            any = true;
            if dot { x += (c - b'0') as f64 * frac; frac *= 0.1; }
            else { x = x * 10.0 + (c - b'0') as f64; }
            i += 1;
        } else if c == b',' || c == b'_' {
            i += 1;
        } else if c == b'.' && !dot {
            dot = true; i += 1;
        } else { break; }
    }
    if !any { return None; }
    while i < text.len() && vr_ws(text[i]) { i += 1; }
    if i < text.len() {
        match vr_lower(text[i]) {
            b'k' => x *= 1e3,
            b'm' => x *= 1e6,
            b'b' => x *= 1e9,
            _ => {}
        }
    }
    let pct = text[i..].first() == Some(&b'%');
    Some((x, pct))
}

fn vr_numeric_mismatch(gt: &[u8], ans: &[u8]) -> bool {
    match (vr_first_number(gt), vr_first_number(ans)) {
        (None, None) => false,
        (Some((g, gp)), Some((a, ap))) => {
            if gp != ap { return true; }
            let scale = if g.abs() > a.abs() { g.abs() } else { a.abs() }.max(1.0);
            (g - a).abs() > scale * 0.001 + 1e-6
        }
        _ => true,
    }
}

fn vr_question_requires_number(question: &[u8]) -> bool {
    (vr_has_word(question, b"how") && (vr_has_word(question, b"many") || vr_has_word(question, b"much")))
        || vr_has_word(question, b"amount")
        || vr_has_word(question, b"value")
        || vr_has_word(question, b"percentage")
}

fn vr_safe_pow(score: f32) -> f32 {
    if score <= 0.0 { return 0.0; }
    if score >= 1.0 { return 1.0; }
    // Gentle monotone stretch using libm already required by the baseline.
    let y = libm::powf(score, 1.18);
    if y < 0.0 { 0.0 } else if y > 1.0 { 1.0 } else { y }
}

#[no_mangle]
pub unsafe extern "C" fn rank_answer(
    q_ptr: i32, q_len: i32,
    gt_ptr: i32, gt_len: i32,
    ma_ptr: i32, ma_len: i32,
) -> f32 {
    let question = read_str(q_ptr, q_len);
    let ground_truth = read_str(gt_ptr, gt_len);
    let miner_answer = read_str(ma_ptr, ma_len);

    if ground_truth.trim().is_empty() || miner_answer.trim().is_empty() {
        return 0.0;
    }

    // Exact normalized equality is the strongest possible answer.
    let mut gnorm = alloc::string::String::new();
    let mut anorm = alloc::string::String::new();
    for b in ground_truth.as_bytes() {
        if b.is_ascii_alphanumeric() { gnorm.push(vr_lower(*b) as char); }
    }
    for b in miner_answer.as_bytes() {
        if b.is_ascii_alphanumeric() { anorm.push(vr_lower(*b) as char); }
    }
    if !gnorm.is_empty() && gnorm == anorm { return 1.0; }

    let mut s = rank_answer_base(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len);
    if !s.is_finite() { return 0.0; }

    let gt_bytes = ground_truth.as_bytes();
    let ans_bytes = miner_answer.as_bytes();
    if vr_opposite(gt_bytes, ans_bytes) { s *= 0.06; }
    if vr_numeric_mismatch(gt_bytes, ans_bytes) { s *= 0.22; }
    if vr_question_requires_number(question.as_bytes()) && vr_first_number(ans_bytes).is_none() { s *= 0.82; }

    vr_safe_pow(s)
}

// Keep the baseline breakdown export available for diagnostics. It remains a
// faithful report of the underlying four baseline signals, while rank_answer
// is the Veridex guarded decision path.
#[no_mangle]
pub unsafe extern "C" fn breakdown_answer(
    q_ptr: i32, q_len: i32,
    gt_ptr: i32, gt_len: i32,
    ma_ptr: i32, ma_len: i32,
) -> i32 {
    breakdown_answer_base(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len)
}
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
        root = pathlib.Path(td)
        upstream = root / "baseline"
        run(["git", "clone", "--filter=blob:none", BASELINE_REPO, str(upstream)], root)
        run(["git", "checkout", BASELINE_COMMIT], upstream)

        lib = upstream / "src" / "lib.rs"
        text = lib.read_text(encoding="utf-8")
        if "pub unsafe extern \"C\" fn rank_answer(" not in text:
            raise SystemExit("unexpected baseline lib.rs: rank_answer signature missing")
        if "pub unsafe extern \"C\" fn breakdown_answer(" not in text:
            raise SystemExit("unexpected baseline lib.rs: breakdown_answer signature missing")
        text = text.replace(
            "pub unsafe extern \"C\" fn rank_answer(",
            "pub unsafe extern \"C\" fn rank_answer_base(",
            1,
        )
        text = text.replace(
            "pub unsafe extern \"C\" fn breakdown_answer(",
            "pub unsafe extern \"C\" fn breakdown_answer_base(",
            1,
        )
        # The base functions were #[no_mangle] exports. They remain available as
        # implementation symbols; Telegraph only needs the final rank_answer.
        lib.write_text(text + WRAPPER, encoding="utf-8")

        # Build with the real INT8 MiniLM weights included by the pinned baseline.
        run(["rustup", "target", "add", "wasm32-unknown-unknown"], upstream)
        run(["cargo", "build", "--release", "--target", "wasm32-unknown-unknown", "--features", "real_weights"], upstream)
        built = upstream / "target" / "wasm32-unknown-unknown" / "release" / "telegraph_scoring.wasm"
        if not built.exists():
            raise SystemExit(f"build succeeded but output missing: {built}")
        shutil.copy2(built, out)

        print(f"upstream commit: {BASELINE_COMMIT}")
        print(f"output: {out}")
        print(f"bytes: {out.stat().st_size}")


if __name__ == "__main__":
    main()
