#!/usr/bin/env python3
"""Track-2 release doctor v3.

Uses the vetted v2 stage implementations, but closes the critical recovery
loop: a semantic lab failure is read from presubmit-report.json, diagnosed,
paired with an allow-listed generalized repair, rebuilt, and retested before
any authoritative gate. Infrastructure errors are separately auto-repaired.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, sys
from pathlib import Path

from track2_release_doctor_v2 import (
    BASELINE, CHECKER, CHECKER_BIN, CHECKER_COMMIT, CONTRACT, CORPUS, EVID,
    GEN, LABRUN, LIVE, MUT, PRE, PRIMARY, RELEASE, REPORT, ROOT, TOUR,
    build, structural, generate, lab as run_lab, semantic_repair,
    infra_repair, prepare_checker, checker, gate, emit, transient
)


def diagnose(report: dict, text: str = '') -> list[str]:
    blob=(json.dumps(report)+' '+text).lower(); out=[]
    sh=report.get('shadow',{}); hist=report.get('historical_replay',{})
    if sh.get('inversions',0): out.append('shadow-inversion')
    if hist.get('inversions',0): out.append('historical-inversion')
    if sh.get('mean_margin',1.0) < 0.20: out.append('weak-margin')
    if any(x in blob for x in ('numeric','currency','percentage','number')): out.append('numeric')
    if any(x in blob for x in ('direction','polarity','negation','opposite')): out.append('polarity')
    if any(x in blob for x in ('incomplete','fragment','qualifier','distractor')): out.append('completeness')
    return sorted(set(out))


def ensure_tooling() -> None:
    for p in (GEN, LABRUN):
        ok,err=__import__('track2_release_doctor_v2').pycheck(p)
        if not ok:
            fixed,detail=infra_repair(err); emit('doctor-tooling.json',{'file':str(p),'error':err,'repaired':fixed,'detail':detail})
            if not fixed: raise RuntimeError('lab-tooling: '+err)


def run_candidate_loop(wasm: Path, rounds: int, deep_rounds: int, max_iter: int):
    history=[]
    for i in range(1,max(1,min(max_iter,4))+1):
        try:
            build(wasm); structural(wasm); generate(rounds if i==1 else min(deep_rounds,16))
        except Exception as e:
            msg=str(e); fixed,detail=infra_repair(msg); emit(f'doctor-infra-{i}.json',{'error':msg,'repaired':fixed,'detail':detail})
            if fixed and i<max_iter: continue
            raise
        try:
            report=run_lab(wasm)
            reasons=diagnose(report)
            history.append({'iteration':i,'reasons':reasons,'shadow':report.get('shadow',{}),'historical':report.get('historical_replay',{})})
            emit('doctor-history.json',{'history':history})
            if not reasons: return history
            fixed,detail=semantic_repair(reasons)
            emit(f'doctor-semantic-{i}.json',{'reasons':reasons,'repaired':fixed,'detail':detail})
            if not fixed: raise RuntimeError('candidate semantic failure with no unused approved repair: '+','.join(reasons))
        except Exception as e:
            # presubmit_lab_v2 writes REPORT even when strict scoring returns non-zero.
            report=json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}
            reasons=diagnose(report,str(e))
            if reasons:
                fixed,detail=semantic_repair(reasons)
                emit(f'doctor-semantic-exception-{i}.json',{'error':str(e),'reasons':reasons,'repaired':fixed,'detail':detail})
                history.append({'iteration':i,'exception':str(e),'reasons':reasons})
                if fixed and i<max_iter: continue
            raise
    raise RuntimeError('candidate repair iteration budget exhausted')


def authoritative(wasm: Path, max_iter: int):
    globalize=lambda: setattr(__import__('track2_release_doctor_v2'),'WASM_GLOBAL',wasm)
    globalize(); attempts=[]
    for attempt in range(1,max(1,min(max_iter,4))+1):
        try:
            gate('preflight',['node',str(PRE),str(wasm),str(PRIMARY)])
            gate('tournament',['node',str(TOUR),str(wasm),str(PRIMARY)])
            gate('contract-preflight',['node',str(PRE),str(wasm),str(CONTRACT)])
            gate('contract-tournament',['node',str(TOUR),str(wasm),str(CONTRACT)])
            prepare_checker(); checker(CHECKER/'examples/hard.json','public-hard-json')
            gate('mutation',['node',str(MUT),str(wasm),str(PRIMARY)])
            gate('live-risk',['node',str(LIVE),str(wasm),str(PRIMARY)])
            checker(PRIMARY,'wazero')
            return
        except Exception as e:
            msg=str(e); attempts.append(msg); emit(f'doctor-authoritative-{attempt}.json',{'error':msg})
            report=json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}
            reasons=diagnose(report,msg)
            fixed,detail=semantic_repair(reasons) if reasons else (False,'no semantic repair selected')
            emit(f'doctor-authoritative-repair-{attempt}.json',{'reasons':reasons,'repaired':fixed,'detail':detail})
            if fixed and attempt<max_iter:
                build(wasm); structural(wasm); generate(min(max_iter*2,16)); run_lab(wasm); globalize(); continue
            if attempt<max_iter and transient(msg): continue
            raise


def main()->int:
    ap=argparse.ArgumentParser(); ap.add_argument('--wasm',type=Path,default=ROOT/'telegraph/evaluation/veridex-track2-final.wasm'); ap.add_argument('--rounds',type=int,default=2); ap.add_argument('--deep-rounds',type=int,default=8); ap.add_argument('--max-iterations',type=int,default=3); ap.add_argument('--json',action='store_true'); a=ap.parse_args()
    a.wasm.parent.mkdir(parents=True,exist_ok=True); EVID.mkdir(parents=True,exist_ok=True)
    ensure_tooling(); history=run_candidate_loop(a.wasm,a.rounds,a.deep_rounds,a.max_iterations); authoritative(a.wasm,a.max_iterations)
    sha=hashlib.sha256(a.wasm.read_bytes()).hexdigest()
    (ROOT/'telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt').write_text(f'{sha}  {a.wasm.name}\nsource baseline commit: {BASELINE}\nchecker commit: {CHECKER_COMMIT}\nsource commit: {os.getenv("GITHUB_SHA","local")}\n',encoding='utf-8')
    result={'verdict':'GREEN','sha256':sha,'wasm_bytes':a.wasm.stat().st_size,'doctor_history':history}; emit('release-doctor-final.json',result); print(json.dumps(result,indent=2)); return 0

if __name__=='__main__': raise SystemExit(main())
