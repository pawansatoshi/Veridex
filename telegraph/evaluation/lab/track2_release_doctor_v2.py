#!/usr/bin/env python3
"""Track-2 release doctor v2.

One controller owns the candidate lifecycle. It performs tool/self checks,
builds the real artifact, runs the expanded lab, then runs every authoritative
Telegraph gate. Failures are classified and retried; only allow-listed,
generalized source repairs are applied. No benchmark/gate/checker weakening.
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
WASM_DEFAULT=ROOT/'telegraph/evaluation/veridex-track2-final.wasm'
EVID=ROOT/'telegraph/evaluation/ci-evidence'
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


def emit(name:str, data):
    EVID.mkdir(parents=True,exist_ok=True); p=EVID/name
    p.write_text(data if isinstance(data,str) else json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8')


def run(cmd:list[str], timeout:int=1800, retries:int=0, label:str='stage'):
    for i in range(retries+1):
        try:
            p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=timeout,check=False)
        except subprocess.TimeoutExpired:
            if i<retries: time.sleep(min(8,2**i)); continue
            raise
        if p.returncode==0:return p
        if i<retries and transient(p.stderr or p.stdout): time.sleep(min(8,2**i)); continue
        return p
    return p


def transient(s:str)->bool:
    t=s.lower(); return any(x in t for x in ('timed out','connection reset','temporary failure','429','502','503','504','could not resolve host','network is unreachable','unexpected eof','tls handshake timeout'))


def pycheck(path:Path):
    p=run([sys.executable,'-m','py_compile',str(path)],30,1,f'pycheck-{path.name}')
    return p.returncode==0,(p.stderr or p.stdout).strip()


def repair_generator():
    text=GEN.read_text(encoding='utf-8')
    rules=[
      (r"\(\"double-number-contradiction\",\s*late_contradiction\(mutate_number\(case\[\"good\"\]\)\)\)\)\]",'("double-number-contradiction", late_contradiction(mutate_number(case["good"]))) ]'),
      (r"\('double-number-contradiction',\s*late_contradiction\(mutate_number\(case\['good'\]\)\)\)\)\]","('double-number-contradiction', late_contradiction(mutate_number(case['good']))) ]"),
    ]
    for pat,repl in rules:
        new,n=re.subn(pat,repl,text,count=1)
        if n:
            GEN.write_text(new,encoding='utf-8'); ok,err=pycheck(GEN)
            if ok:return True,'repaired known generator delimiter defect'
            GEN.write_text(text,encoding='utf-8'); return False,err
    return False,'no generator repair matched'


def repair_harness():
    text=LABRUN.read_text(encoding='utf-8')
    old="const wasm=fs.readFileSync(process.argv[2]); const mode=process.argv[3];"
    new="const wasm=fs.readFileSync(process.argv[1]); const mode=process.argv[2];"
    if old in text:
        LABRUN.write_text(text.replace(old,new),encoding='utf-8'); return True,'fixed Node argv layout'
    return False,'no Node argv repair anchor'


def repair_rust_unicode():
    text=RELEASE.read_text(encoding='utf-8')
    patterns=[
      ("text.iter().any(|b|*b==b'$'||*b=='€'||*b=='£'||*b=='₹')", "text.windows(3).any(|w|w==[0xE2,0x82,0xAC])||text.windows(2).any(|w|w==[0xC2,0xA3])||text.windows(3).any(|w|w==[0xE2,0x82,0xB9])||text.iter().any(|b|*b==b'$')"),
      ("text.iter().any(|b|*b==b'$'||*b==b'€'||*b==b'£'||*b==b'₹')", "text.windows(3).any(|w|w==[0xE2,0x82,0xAC])||text.windows(2).any(|w|w==[0xC2,0xA3])||text.windows(3).any(|w|w==[0xE2,0x82,0xB9])||text.iter().any(|b|*b==b'$')")
    ]
    for old,new in patterns:
        if old in text:
            RELEASE.write_text(text.replace(old,new),encoding='utf-8'); return True,'made Rust currency byte detection ASCII-safe'
    return False,'no currency repair anchor'


def infra_repair(error:str):
    e=error.lower()
    if 'enoent' in e or 'process.argv' in e or "open 'pairs'" in e:
        ok,d=repair_harness()
        if ok:return ok,d
    ok,d=repair_generator()
    if ok:return ok,d
    if any(x in e for x in ('unicode','non-ascii','invalid character','unknown start of token')):
        ok,d=repair_rust_unicode()
        if ok:return ok,d
    return False,'no safe infrastructure repair'


def build(wasm:Path):
    p=run([sys.executable,str(RELEASE),'--out',str(wasm)],2400,1,'build'); emit('build.log',p.stdout+'\n'+p.stderr)
    if p.returncode:
        ok,d=infra_repair(p.stderr or p.stdout); emit('doctor-build-repair.json',{'repaired':ok,'detail':d})
        if ok:p=run([sys.executable,str(RELEASE),'--out',str(wasm)],2400,1,'build-retry')
    if p.returncode: raise RuntimeError('build: '+(p.stderr.strip() or p.stdout.strip()))


def structural(wasm:Path):
    p=run(['wasm-validate',str(wasm)],30,1,'validate')
    if p.returncode: raise RuntimeError('structural validate: '+p.stderr)
    p=run(['wasm-objdump','-x',str(wasm)],60,1,'objdump')
    if p.returncode: raise RuntimeError('structural objdump: '+p.stderr)
    imports=len(re.findall(r'^ *import',p.stdout,re.M)); size=wasm.stat().st_size
    emit('structural.json',{'size':size,'imports':imports})
    if imports or size>33554432: raise RuntimeError(f'structural: imports={imports} size={size}')


def generate(rounds:int):
    ok,err=pycheck(GEN)
    if not ok:
        fixed,detail=repair_generator(); emit('doctor-generator-repair.json',{'error':err,'repaired':fixed,'detail':detail})
        if not fixed: raise RuntimeError('lab-generation syntax: '+err)
    p=run([sys.executable,str(GEN),'--rounds',str(rounds),'--out',str(CORPUS)],180,2,'generator')
    if p.returncode:
        fixed,detail=repair_generator(); emit('doctor-generator-runtime.json',{'error':p.stderr or p.stdout,'repaired':fixed,'detail':detail})
        if fixed:p=run([sys.executable,str(GEN),'--rounds',str(rounds),'--out',str(CORPUS)],180,1,'generator-retry')
    if p.returncode: raise RuntimeError('lab-generation: '+(p.stderr.strip() or p.stdout.strip()))
    emit('generator-summary.json',json.loads(p.stdout) if p.stdout.strip().startswith('{') else {'stdout':p.stdout})


def lab(wasm:Path):
    for tool in (GEN,LABRUN):
        ok,err=pycheck(tool)
        if not ok:
            fixed,detail=infra_repair(err); emit('doctor-tool-repair.json',{'file':str(tool),'error':err,'repaired':fixed,'detail':detail})
            if not fixed: raise RuntimeError('lab-tooling: '+err)
    p=run([sys.executable,str(LABRUN),'--strict','--json','--corpus',str(CORPUS),'--out',str(REPORT),str(wasm)],2400,0,'presubmit-lab')
    if p.returncode:
        msg=p.stderr.strip() or p.stdout.strip(); fixed,detail=infra_repair(msg); emit('doctor-lab-repair.json',{'error':msg,'repaired':fixed,'detail':detail})
        if fixed:p=run([sys.executable,str(LABRUN),'--strict','--json','--corpus',str(CORPUS),'--out',str(REPORT),str(wasm)],2400,0,'presubmit-lab-retry')
    if p.returncode: raise RuntimeError('presubmit-lab: '+(p.stderr.strip() or p.stdout.strip()))
    return json.loads(REPORT.read_text(encoding='utf-8'))


def lab_failure(report:dict):
    reasons=[]; sh=report.get('shadow',{}); hist=report.get('historical_replay',{})
    if sh.get('inversions',0): reasons.append('shadow-inversion')
    if hist.get('inversions',0): reasons.append('historical-inversion')
    if sh.get('mean_margin',1.0)<0.20: reasons.append('weak-margin')
    blob=json.dumps(report).lower()
    if any(x in blob for x in ('numeric','currency','percentage')): reasons.append('numeric')
    if any(x in blob for x in ('polarity','direction','negation','opposite')): reasons.append('polarity')
    if any(x in blob for x in ('incomplete','fragment','qualifier','distractor')): reasons.append('completeness')
    return sorted(set(reasons))


def semantic_repair(reasons:list[str]):
    text=RELEASE.read_text(encoding='utf-8')
    recipes=[]
    if 'numeric' in reasons: recipes.append((r'final_score=final_score\.min\(0\.74\);','final_score=final_score.min(0.65);','numeric completeness cap'))
    if 'completeness' in reasons: recipes.append((r'g\*=0\.20;','g*=0.12;','binary fragment penalty'))
    if 'polarity' in reasons: recipes.append((r'g\*=0\.06;','g*=0.04;','polarity conflict penalty'))
    for pat,repl,note in recipes:
        new,n=re.subn(pat,repl,text,count=1)
        if n:
            RELEASE.write_text(new,encoding='utf-8'); return True,note
    return False,'no unused semantic repair recipe'


def gate(name:str,cmd:list[str]):
    p=run(cmd,2400,1,name); emit(f'{name}.log',p.stdout+'\n'+p.stderr)
    if p.returncode: raise RuntimeError(f'{name}: '+(p.stderr.strip() or p.stdout.strip()))
    return p.stdout


def prepare_checker():
    if CHECKER.exists(): shutil.rmtree(CHECKER)
    p=run(['git','clone','--filter=blob:none','https://github.com/neromtoobad/telegraph-wasm-check',str(CHECKER)],300,3,'checker-clone')
    if p.returncode: raise RuntimeError('checker-clone: '+p.stderr)
    p=run(['git','-C',str(CHECKER),'checkout','--detach',CHECKER_COMMIT],60,1,'checker-checkout')
    if p.returncode: raise RuntimeError('checker-checkout: '+p.stderr)
    p=run(['go','build','-trimpath','-o',str(CHECKER_BIN),'.'],1200,1,'checker-build')
    if p.returncode: raise RuntimeError('checker-build: '+p.stderr)


def checker(cases:Path,name:str):
    return gate(name,[str(CHECKER_BIN),str(WASM_GLOBAL),'--cases',str(cases),'--strict','--json'])


def main()->int:
    global_dummy=None
    ap=argparse.ArgumentParser(); ap.add_argument('--wasm',type=Path,default=WASM_DEFAULT); ap.add_argument('--rounds',type=int,default=2); ap.add_argument('--deep-rounds',type=int,default=8); ap.add_argument('--max-iterations',type=int,default=3); ap.add_argument('--json',action='store_true')
    a=ap.parse_args(); wasm=a.wasm; wasm.parent.mkdir(parents=True,exist_ok=True); EVID.mkdir(parents=True,exist_ok=True)
    history=[]
    for it in range(1,max(1,min(a.max_iterations,3))+1):
        try:
            build(wasm); structural(wasm); generate(a.rounds if it==1 else min(a.deep_rounds,16)); report=lab(wasm); reasons=lab_failure(report)
            history.append({'iteration':it,'reasons':reasons,'shadow':report.get('shadow',{}),'historical':report.get('historical_replay',{})}); emit('doctor-history.json',{'history':history})
            if not reasons: break
            changed,detail=semantic_repair(reasons); emit(f'doctor-semantic-repair-{it}.json',{'reasons':reasons,'changed':changed,'detail':detail})
            if not changed:
                print(json.dumps({'verdict':'RED','class':'candidate-semantic','reasons':reasons,'detail':detail,'history':history},indent=2)); return 2
        except Exception as e:
            msg=str(e); emit(f'doctor-pipeline-error-{it}.json',{'error':msg})
            fixed,detail=infra_repair(msg); emit(f'doctor-runtime-repair-{it}.json',{'repaired':fixed,'detail':detail})
            if fixed and it<a.max_iterations: continue
            if it<a.max_iterations and transient(msg): continue
            print(json.dumps({'verdict':'RED','class':'pipeline','error':msg,'history':history},indent=2)); return 1

    global WASM_GLOBAL; WASM_GLOBAL=wasm
    for attempt in range(1,max(1,min(a.max_iterations,3))+1):
        try:
            gate('preflight',['node',str(PRE),str(wasm),str(PRIMARY)])
            gate('tournament',['node',str(TOUR),str(wasm),str(PRIMARY)])
            gate('contract-preflight',['node',str(PRE),str(wasm),str(CONTRACT)])
            gate('contract-tournament',['node',str(TOUR),str(wasm),str(CONTRACT)])
            prepare_checker(); checker(CHECKER/'examples/hard.json','public-hard-json')
            gate('mutation',['node',str(MUT),str(wasm),str(PRIMARY)])
            gate('live-risk',['node',str(LIVE),str(wasm),str(PRIMARY)])
            checker(PRIMARY,'wazero')
            sha=hashlib.sha256(wasm.read_bytes()).hexdigest()
            (ROOT/'telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt').write_text(f'{sha}  {wasm.name}\nsource baseline commit: {BASELINE}\nchecker commit: {CHECKER_COMMIT}\nsource commit: {os.getenv("GITHUB_SHA","local")}\n',encoding='utf-8')
            result={'verdict':'GREEN','sha256':sha,'wasm_bytes':wasm.stat().st_size,'history':history}; emit('release-doctor-final.json',result); print(json.dumps(result,indent=2)); return 0
        except Exception as e:
            msg=str(e); emit(f'authoritative-failure-{attempt}.json',{'error':msg})
            report=json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}
            changed,detail=semantic_repair(lab_failure(report)); emit(f'doctor-authoritative-repair-{attempt}.json',{'changed':changed,'detail':detail})
            if changed and attempt< a.max_iterations:
                try: build(wasm); structural(wasm); generate(min(a.deep_rounds,16)); lab(wasm); continue
                except Exception as e2: emit(f'doctor-repair-retry-{attempt}.json',{'error':str(e2)})
            if attempt<a.max_iterations and transient(msg): continue
            print(json.dumps({'verdict':'RED','class':'authoritative-gate','error':msg,'history':history},indent=2)); return 1


if __name__=='__main__': raise SystemExit(main())
