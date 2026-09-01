#!/usr/bin/env python3
"""Track-2 release doctor: deterministic, bounded, self-healing, fail-closed.

Owns the complete candidate lifecycle. It may repair only allow-listed lab
infrastructure defects or conservative source-level guard recipes. It never
edits benchmark/checker thresholds or benchmark data. Every repair is rebuilt
and re-tested from scratch; an artifact is GREEN only after the local lab and
all authoritative Telegraph gates pass.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
LAB=Path(__file__).resolve().parent
RELEASE=ROOT/'telegraph/evaluation/neural/build_candidate_fast_release.py'
GEN=LAB/'generate_shadow_corpus_v2.py'
LABRUN=LAB/'presubmit_lab_v2.py'
CORPUS=LAB/'shadow_corpus.generated.json'
REPORT=ROOT/'presubmit-report.json'
EVID=ROOT/'telegraph/evaluation/ci-evidence'
WASM_DEFAULT=ROOT/'telegraph/evaluation/veridex-track2-final.wasm'
PRE=ROOT/'telegraph/evaluation/track2-preflight.js'
TOUR=ROOT/'telegraph/evaluation/track2-tournament.js'
MUT=ROOT/'telegraph/evaluation/track2-mutation-suite.mjs'
LIVE=ROOT/'telegraph/evaluation/track2-live-risk-stress.mjs'
PRIMARY=ROOT/'telegraph/evaluation/track2-benchmark-v2.json'
CONTRACT=ROOT/'telegraph/evaluation/track2-benchmark-contract-v1.json'
CHECKER=Path('/tmp/telegraph-wasm-check')
CHECKER_BIN=Path('/tmp/telegraph-wasm-check-bin')
CHECKER_COMMIT='f537c7c085e9d3366c5615fe1ad1f98a0abeff7c'
BASELINE='dfa0cf7fda72789267811ba2190f61a8eaacedf6'


def emit(name,data):
    EVID.mkdir(parents=True,exist_ok=True)
    (EVID/name).write_text(data if isinstance(data,str) else json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8')


def transient(s):
    t=(s or '').lower()
    return any(x in t for x in ('timed out','connection reset','temporary failure','429','502','503','504','could not resolve host','network is unreachable','unexpected eof','tls handshake timeout'))


def run(cmd,timeout=1800,retries=0):
    last=None
    for attempt in range(retries+1):
        try:
            p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=timeout,check=False)
        except subprocess.TimeoutExpired as e:
            last=e
            if attempt<retries: time.sleep(2**attempt); continue
            raise
        last=p
        if p.returncode==0 or attempt>=retries or not transient(p.stderr or p.stdout): return p
        time.sleep(min(8,2**attempt))
    return last


def pycheck(path):
    p=run([sys.executable,'-m','py_compile',str(path)],30,1)
    return p.returncode==0,(p.stderr or p.stdout).strip()


def repair_generator():
    text=GEN.read_text(encoding='utf-8')
    patterns=[
      (r"\(\"double-number-contradiction\",\s*late_contradiction\(mutate_number\(case\[\"good\"\]\)\)\)\)\]", '("double-number-contradiction", late_contradiction(mutate_number(case["good"]))) ]'),
      (r"\('double-number-contradiction',\s*late_contradiction\(mutate_number\(case\['good'\]\)\)\)\)\]", "('double-number-contradiction', late_contradiction(mutate_number(case['good']))) ]"),
    ]
    for pat,repl in patterns:
        new,n=re.subn(pat,repl,text,count=1)
        if n:
            GEN.write_text(new,encoding='utf-8'); ok,err=pycheck(GEN)
            if ok:return True,'repaired known generator delimiter defect'
            GEN.write_text(text,encoding='utf-8'); return False,err
    return False,'no approved generator repair matched'


def repair_harness():
    text=LABRUN.read_text(encoding='utf-8')
    old="const wasm=fs.readFileSync(process.argv[2]); const mode=process.argv[3];"
    new="const wasm=fs.readFileSync(process.argv[1]); const mode=process.argv[2];"
    if old in text:
        LABRUN.write_text(text.replace(old,new),encoding='utf-8'); ok,_=pycheck(LABRUN)
        if ok:return True,'fixed Node -e argv layout'
        return False,'Node argv repair failed syntax validation'
    return False,'no Node argv repair anchor'


def repair_rust_unicode():
    text=RELEASE.read_text(encoding='utf-8')
    old="text.iter().any(|b|*b==b'$'||*b=='€'||*b=='£'||*b=='₹')"
    new="text.windows(3).any(|w|w==[0xE2,0x82,0xAC])||text.windows(2).any(|w|w==[0xC2,0xA3])||text.windows(3).any(|w|w==[0xE2,0x82,0xB9])||text.iter().any(|b|*b==b'$')"
    if old in text:
        RELEASE.write_text(text.replace(old,new),encoding='utf-8'); return True,'made currency detection ASCII-safe'
    return False,'no Unicode repair anchor'


def infra_repair(error):
    e=(error or '').lower()
    if 'enoent' in e or 'process.argv' in e or "open 'pairs'" in e:
        ok,d=repair_harness()
        if ok:return ok,d
    if any(x in e for x in ('syntaxerror','invalid syntax','unterminated','unexpected indent')):
        ok,d=repair_generator()
        if ok:return ok,d
    if any(x in e for x in ('unicode','non-ascii','unknown start of token')):
        ok,d=repair_rust_unicode()
        if ok:return ok,d
    return False,'no safe infrastructure repair'


def build(wasm):
    p=run([sys.executable,str(RELEASE),'--out',str(wasm)],2400,1); emit('build.log',p.stdout+'\n'+p.stderr)
    if p.returncode:
        ok,d=infra_repair(p.stderr or p.stdout); emit('doctor-build-repair.json',{'repaired':ok,'detail':d})
        if ok:p=run([sys.executable,str(RELEASE),'--out',str(wasm)],2400,1)
    if p.returncode: raise RuntimeError('build: '+(p.stderr.strip() or p.stdout.strip()))


def structural(wasm):
    p=run(['wasm-validate',str(wasm)],30,1)
    if p.returncode: raise RuntimeError('structural validate: '+p.stderr)
    p=run(['wasm-objdump','-x',str(wasm)],60,1)
    if p.returncode: raise RuntimeError('structural objdump: '+p.stderr)
    imports=len(re.findall(r'^ *import',p.stdout,re.M)); size=wasm.stat().st_size
    emit('structural.json',{'size':size,'imports':imports})
    if imports or size>33554432: raise RuntimeError(f'structural: imports={imports} size={size}')


def generate(rounds):
    ok,err=pycheck(GEN)
    if not ok:
        fixed,detail=repair_generator(); emit('doctor-generator-repair.json',{'error':err,'repaired':fixed,'detail':detail})
        if not fixed: raise RuntimeError('lab-generation syntax: '+err)
    p=run([sys.executable,str(GEN),'--rounds',str(rounds),'--out',str(CORPUS)],180,2)
    if p.returncode:
        fixed,detail=repair_generator(); emit('doctor-generator-runtime.json',{'error':p.stderr or p.stdout,'repaired':fixed,'detail':detail})
        if fixed:p=run([sys.executable,str(GEN),'--rounds',str(rounds),'--out',str(CORPUS)],180,1)
    if p.returncode: raise RuntimeError('lab-generation: '+(p.stderr.strip() or p.stdout.strip()))
    emit('generator-summary.json',json.loads(p.stdout) if p.stdout.strip().startswith('{') else {'stdout':p.stdout})


def run_lab(wasm):
    for tool in (GEN,LABRUN):
        ok,err=pycheck(tool)
        if not ok:
            fixed,detail=infra_repair(err); emit('doctor-tool-repair.json',{'file':str(tool),'error':err,'repaired':fixed,'detail':detail})
            if not fixed: raise RuntimeError('lab-tooling: '+err)
    p=run([sys.executable,str(LABRUN),'--strict','--json','--corpus',str(CORPUS),'--out',str(REPORT),str(wasm)],2400,0)
    if p.returncode:
        msg=p.stderr.strip() or p.stdout.strip(); fixed,detail=infra_repair(msg); emit('doctor-lab-repair.json',{'error':msg,'repaired':fixed,'detail':detail})
        if fixed:p=run([sys.executable,str(LABRUN),'--strict','--json','--corpus',str(CORPUS),'--out',str(REPORT),str(wasm)],2400,0)
    if p.returncode: raise RuntimeError('presubmit-lab: '+(p.stderr.strip() or p.stdout.strip()))
    return json.loads(REPORT.read_text(encoding='utf-8'))


def diagnose(report,text=''):
    blob=(json.dumps(report)+' '+text).lower(); out=[]
    sh=report.get('shadow',{}); hist=report.get('historical_replay',{})
    if sh.get('inversions',0): out.append('shadow-inversion')
    if hist.get('inversions',0): out.append('historical-inversion')
    if sh.get('mean_margin',1)<.20: out.append('weak-margin')
    if any(x in blob for x in ('numeric','currency','percentage','number')): out.append('numeric')
    if any(x in blob for x in ('direction','polarity','negation','opposite')): out.append('polarity')
    if any(x in blob for x in ('incomplete','fragment','qualifier','distractor')): out.append('completeness')
    return sorted(set(out))


def semantic_repair(reasons):
    text=RELEASE.read_text(encoding='utf-8')
    recipes=[]
    if 'numeric' in reasons: recipes.append((r'final_score=final_score\.min\(0\.74\);','final_score=final_score.min(0.65);','numeric completeness cap tightened'))
    if 'completeness' in reasons: recipes.append((r'g\*=0\.20;','g*=0.12;','binary fragment penalty tightened'))
    if 'polarity' in reasons: recipes.append((r'g\*=0\.06;','g*=0.04;','polarity conflict penalty tightened'))
    for pat,repl,note in recipes:
        new,n=re.subn(pat,repl,text,count=1)
        if n:
            RELEASE.write_text(new,encoding='utf-8'); return True,note
    return False,'no unused approved semantic repair recipe'


def gate(name,cmd):
    p=run(cmd,2400,1); emit(f'{name}.log',p.stdout+'\n'+p.stderr)
    if p.returncode: raise RuntimeError(f'{name}: '+(p.stderr.strip() or p.stdout.strip()))
    return p.stdout


def prepare_checker():
    if CHECKER.exists(): shutil.rmtree(CHECKER)
    p=run(['git','clone','--filter=blob:none','https://github.com/neromtoobad/telegraph-wasm-check',str(CHECKER)],300,3)
    if p.returncode: raise RuntimeError('checker-clone: '+p.stderr)
    p=run(['git','-C',str(CHECKER),'checkout','--detach',CHECKER_COMMIT],60,1)
    if p.returncode: raise RuntimeError('checker-checkout: '+p.stderr)
    p=run(['go','build','-trimpath','-o',str(CHECKER_BIN),'.'],1200,1)
    if p.returncode: raise RuntimeError('checker-build: '+p.stderr)


def checker(wasm,cases,name):
    return gate(name,[str(CHECKER_BIN),str(wasm),'--cases',str(cases),'--strict','--json'])


def authoritative(wasm,max_iter):
    for attempt in range(1,max(1,min(max_iter,4))+1):
        try:
            gate('preflight',['node',str(PRE),str(wasm),str(PRIMARY)])
            gate('tournament',['node',str(TOUR),str(wasm),str(PRIMARY)])
            gate('contract-preflight',['node',str(PRE),str(wasm),str(CONTRACT)])
            gate('contract-tournament',['node',str(TOUR),str(wasm),str(CONTRACT)])
            prepare_checker(); checker(wasm,CHECKER/'examples/hard.json','public-hard-json')
            gate('mutation',['node',str(MUT),str(wasm),str(PRIMARY)])
            gate('live-risk',['node',str(LIVE),str(wasm),str(PRIMARY)])
            checker(wasm,PRIMARY,'wazero')
            return
        except Exception as e:
            msg=str(e); emit(f'doctor-authoritative-{attempt}.json',{'error':msg})
            if transient(msg) and attempt<max_iter: continue
            report=json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}
            reasons=diagnose(report,msg); fixed,detail=semantic_repair(reasons) if reasons else (False,'no semantic repair selected')
            emit(f'doctor-authoritative-repair-{attempt}.json',{'reasons':reasons,'repaired':fixed,'detail':detail})
            if fixed and attempt<max_iter:
                build(wasm); structural(wasm); generate(min(16,max_iter*4)); run_lab(wasm); continue
            raise


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--wasm',type=Path,default=WASM_DEFAULT); ap.add_argument('--rounds',type=int,default=2); ap.add_argument('--deep-rounds',type=int,default=8); ap.add_argument('--max-iterations',type=int,default=3); ap.add_argument('--json',action='store_true'); a=ap.parse_args()
    if not(1<=a.rounds<=a.deep_rounds<=16): raise SystemExit('require 1 <= rounds <= deep-rounds <= 16')
    if not(1<=a.max_iterations<=4): raise SystemExit('--max-iterations must be 1..4')
    a.wasm.parent.mkdir(parents=True,exist_ok=True); EVID.mkdir(parents=True,exist_ok=True)
    history=[]
    for tool in (GEN,LABRUN):
        ok,err=pycheck(tool)
        if not ok:
            fixed,detail=infra_repair(err); emit('doctor-startup-repair.json',{'file':str(tool),'error':err,'repaired':fixed,'detail':detail})
            if not fixed: raise SystemExit('lab tooling is not self-repairable: '+err)
    for i in range(1,a.max_iterations+1):
        try:
            build(a.wasm); structural(a.wasm); generate(a.rounds if i==1 else min(a.deep_rounds,16)); report=run_lab(a.wasm)
            reasons=diagnose(report); history.append({'iteration':i,'reasons':reasons,'shadow':report.get('shadow',{}),'historical':report.get('historical_replay',{})}); emit('doctor-history.json',{'history':history})
            if not reasons: break
            fixed,detail=semantic_repair(reasons); emit(f'doctor-semantic-repair-{i}.json',{'reasons':reasons,'repaired':fixed,'detail':detail})
            if not fixed: raise RuntimeError('candidate semantic failure with no unused approved repair: '+','.join(reasons))
        except Exception as e:
            msg=str(e); emit(f'doctor-pipeline-error-{i}.json',{'error':msg})
            fixed,detail=infra_repair(msg); emit(f'doctor-runtime-repair-{i}.json',{'repaired':fixed,'detail':detail})
            if fixed and i<a.max_iterations: continue
            if transient(msg) and i<a.max_iterations: continue
            raise
    else: raise RuntimeError('candidate repair iteration budget exhausted')
    authoritative(a.wasm,a.max_iterations)
    sha=hashlib.sha256(a.wasm.read_bytes()).hexdigest()
    (ROOT/'telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt').write_text(f'{sha}  {a.wasm.name}\nsource baseline commit: {BASELINE}\nchecker commit: {CHECKER_COMMIT}\nsource commit: {os.getenv("GITHUB_SHA","local")}\n',encoding='utf-8')
    result={'verdict':'GREEN','sha256':sha,'wasm_bytes':a.wasm.stat().st_size,'doctor_history':history}
    emit('release-doctor-final.json',result); print(json.dumps(result,indent=2)); return 0

if __name__=='__main__': raise SystemExit(main())
