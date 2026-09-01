#!/usr/bin/env python3
"""End-to-end Track-2 release doctor.

Owns the complete release lifecycle so a transient/tooling defect does not
become a manual debugging task.  It executes the real gates; it never edits
benchmarks, disables gates, or fabricates results.  Repairs are limited to
allow-listed, generalized infrastructure/scoring recipes and are bounded.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
LAB=Path(__file__).resolve().parent
RELEASE=ROOT/'telegraph/evaluation/neural/build_candidate_fast_release.py'
WASM_DEFAULT=ROOT/'telegraph/evaluation/veridex-track2-final.wasm'
EVID=ROOT/'telegraph/evaluation/ci-evidence'
REPORT=ROOT/'presubmit-report.json'
GEN=LAB/'generate_shadow_corpus_v2.py'
CORPUS=LAB/'shadow_corpus.generated.json'
PRE=LAB/'presubmit_lab_v2.py'
CHECKER=Path('/tmp/telegraph-wasm-check')
CHECKER_BIN=Path('/tmp/telegraph-wasm-check-bin')
CHECKER_COMMIT='f537c7c085e9d3366c5615fe1ad1f98a0abeff7c'
BASELINE='dfa0cf7fda72789267811ba2190f61a8eaacedf6'
MAX_REPAIR=3


def run(cmd:list[str], *, timeout:int=1800, input_text:str|None=None, retries:int=0, stage:str='stage')->subprocess.CompletedProcess[str]:
    last=None
    for attempt in range(retries+1):
        try:
            p=subprocess.run(cmd,cwd=ROOT,text=True,input=input_text,capture_output=True,timeout=timeout,check=False)
        except subprocess.TimeoutExpired as e:
            last=RuntimeError(f'{stage}: timeout after {timeout}s')
            if attempt<retries: time.sleep(2**attempt); continue
            raise last
        if p.returncode==0: return p
        last=p
        if attempt<retries and _transient(p.stderr or p.stdout):
            time.sleep(2**attempt)
            continue
        return p
    return last  # type: ignore


def _transient(s:str)->bool:
    t=s.lower()
    return any(x in t for x in ('timed out','connection reset','temporary failure','429','502','503','504','could not resolve host','network is unreachable'))


def emit(name:str, payload:dict):
    EVID.mkdir(parents=True,exist_ok=True)
    (EVID/name).write_text(json.dumps(payload,indent=2,ensure_ascii=False),encoding='utf-8')


def pycheck(path:Path)->tuple[bool,str]:
    p=run([sys.executable,'-m','py_compile',str(path)],timeout=30,retries=1,stage=f'py_compile {path.name}')
    return p.returncode==0,(p.stderr or p.stdout).strip()


def repair_generator()->tuple[bool,str]:
    text=GEN.read_text(encoding='utf-8')
    pats=[
      (r"\(\"double-number-contradiction\",\s*late_contradiction\(mutate_number\(case\[\"good\"\]\)\)\)\)\]", '("double-number-contradiction", late_contradiction(mutate_number(case["good"]))) ]'),
      (r"\('double-number-contradiction',\s*late_contradiction\(mutate_number\(case\['good'\]\)\)\)\)\]", "('double-number-contradiction', late_contradiction(mutate_number(case['good']))) ]"),
    ]
    for pat,repl in pats:
        new,n=re.subn(pat,repl,text,count=1)
        if n:
            GEN.write_text(new,encoding='utf-8')
            ok,err=pycheck(GEN)
            if ok:return True,'repaired known generator delimiter defect'
            GEN.write_text(text,encoding='utf-8')
            return False,err
    return False,'no approved generator repair matched'


def repair_node_harness()->tuple[bool,str]:
    path=PRE; text=path.read_text(encoding='utf-8')
    old="const wasm=fs.readFileSync(process.argv[2]); const mode=process.argv[3];"
    new="const wasm=fs.readFileSync(process.argv[1]); const mode=process.argv[2];"
    if old in text:
        path.write_text(text.replace(old,new),encoding='utf-8'); return True,'fixed Node argv layout'
    return False,'Node argv repair anchor not present'


def repair_currency_bytes()->tuple[bool,str]:
    path=RELEASE; text=path.read_text(encoding='utf-8')
    old="text.iter().any(|b|*b==b'$'||*b==b'€'||*b==b'£'||*b==b'₹')"
    new="text.windows(3).any(|w|w==[0xE2,0x82,0xAC])||text.windows(2).any(|w|w==[0xC2,0xA3]||w==[0xE2,0x82,0xB9])||text.iter().any(|b|*b==b'$')"
    if old in text:
        path.write_text(text.replace(old,new),encoding='utf-8'); return True,'made currency detection Rust-byte-safe'
    return False,'currency byte repair anchor not present'


def repair_lab_infra(error:str)->tuple[bool,str]:
    ok,detail=repair_node_harness()
    if ok:return ok,detail
    ok,detail=repair_generator()
    if ok:return ok,detail
    if 'invalid character' in error.lower() or 'unicode' in error.lower() or 'non-ascii' in error.lower():
        ok,detail=repair_currency_bytes()
        if ok:return ok,detail
    return False,'no approved lab-infrastructure repair matched'


def build(wasm:Path)->None:
    p=run([sys.executable,str(RELEASE),'--out',str(wasm)],timeout=2400,retries=1,stage='release build')
    if p.returncode: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or 'release build failed')


def structural(wasm:Path)->dict:
    p=run(['wasm-validate',str(wasm)],timeout=30,retries=1,stage='wasm-validate')
    if p.returncode: raise RuntimeError(p.stderr.strip() or 'wasm-validate failed')
    o=run(['wasm-objdump','-x',str(wasm)],timeout=60,retries=1,stage='wasm-objdump')
    if o.returncode: raise RuntimeError(o.stderr.strip() or 'wasm-objdump failed')
    imports=len(re.findall(r'^ *import',o.stdout,re.M))
    size=wasm.stat().st_size
    emit('structural.txt',{'size':size,'imports':imports})
    if size>33554432 or imports!=0: raise RuntimeError(f'structural constraint failed size={size} imports={imports}')
    return {'size':size,'imports':imports}


def generate(rounds:int)->None:
    ok,err=pycheck(GEN)
    if not ok:
        repaired,detail=repair_generator()
        emit('doctor-generator-repair.json',{'before':err,'repaired':repaired,'detail':detail})
        if not repaired: raise RuntimeError(f'generator syntax failure: {err}')
    p=run([sys.executable,str(GEN),'--rounds',str(rounds),'--out',str(CORPUS)],timeout=180,retries=2,stage='shadow corpus generation')
    if p.returncode:
        repaired,detail=repair_generator()
        emit('doctor-generator-runtime-repair.json',{'error':p.stderr or p.stdout,'repaired':repaired,'detail':detail})
        if repaired:
            p=run([sys.executable,str(GEN),'--rounds',str(rounds),'--out',str(CORPUS)],timeout=180,retries=1,stage='shadow corpus retry')
        if p.returncode: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or 'shadow generation failed')
    emit('doctor-generator.json',json.loads(p.stdout) if p.stdout.strip().startswith('{') else {'stdout':p.stdout})


def run_lab(wasm:Path)->dict:
    # preflight the lab harness itself before consuming expensive WASM time
    for tool in (PRE,GEN):
        ok,err=pycheck(tool)
        if not ok:
            repaired,detail=repair_lab_infra(err)
            emit('doctor-tool-repair.json',{'file':str(tool),'error':err,'repaired':repaired,'detail':detail})
            if repaired: ok,err=pycheck(tool)
            if not ok: raise RuntimeError(f'lab infrastructure syntax failure: {err}')
    p=run([sys.executable,str(PRE),'--strict','--json','--corpus',str(CORPUS),'--out',str(REPORT),str(wasm)],timeout=2400,retries=0,stage='presubmit lab')
    if p.returncode:
        msg=p.stderr.strip() or p.stdout.strip()
        # Known harness failures are repaired and retried without touching the candidate.
        if any(x in msg for x in ('ENOENT','process.argv','candidate scorer failed','SyntaxError','Traceback')):
            repaired,detail=repair_lab_infra(msg)
            emit('doctor-lab-repair.json',{'error':msg,'repaired':repaired,'detail':detail})
            if repaired:
                p=run([sys.executable,str(PRE),'--strict','--json','--corpus',str(CORPUS),'--out',str(REPORT),str(wasm)],timeout=2400,retries=0,stage='presubmit lab retry')
        if p.returncode: raise RuntimeError(msg)
    return json.loads(REPORT.read_text(encoding='utf-8'))


def run_node(script:Path, wasm:Path, cases:Path, label:str)->dict:
    p=run(['node',str(script),str(wasm),str(cases)],timeout=2400,retries=1,stage=label)
    if p.returncode: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or f'{label} failed')
    emit(f'{label}.json',{'stdout':p.stdout})
    try:return json.loads(p.stdout)
    except Exception:return {'stdout':p.stdout}


def prepare_checker():
    if CHECKER.exists(): shutil.rmtree(CHECKER)
    p=run(['git','clone','--filter=blob:none','https://github.com/neromtoobad/telegraph-wasm-check',str(CHECKER)],timeout=300,retries=3,stage='checker clone')
    if p.returncode: raise RuntimeError(p.stderr.strip() or 'checker clone failed')
    p=run(['git','-C',str(CHECKER),'checkout','--detach',CHECKER_COMMIT],timeout=60,retries=1,stage='checker checkout')
    if p.returncode: raise RuntimeError(p.stderr.strip() or 'checker checkout failed')
    p=run(['go','build','-trimpath','-o',str(CHECKER_BIN),'.'],timeout=1200,retries=1,stage='checker build')
    if p.returncode: raise RuntimeError(p.stderr.strip() or 'checker build failed')


def run_checker(wasm:Path,cases:Path,label:str):
    p=run([str(CHECKER_BIN),str(wasm),'--cases',str(cases),'--strict','--json'],timeout=2400,retries=1,stage=label)
    if p.returncode: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or f'{label} failed')
    emit(f'{label}.json',json.loads(p.stdout))


def mutate(wasm:Path):
    return run_node(ROOT/'telegraph/evaluation/track2-mutation-suite.mjs',wasm,ROOT/'telegraph/evaluation/track2-benchmark-v2.json','mutation')


def live_risk(wasm:Path):
    return run_node(ROOT/'telegraph/evaluation/track2-live-risk-stress.mjs',wasm,ROOT/'telegraph/evaluation/track2-benchmark-v2.json','live-risk')


def score_failures(report:dict)->list[str]:
    out=[]
    for key in ('critical','shadow','historical_replay'):
        if report.get(key,{}).get('inversions',0): out.append(f'{key}-inversion')
    if report.get('shadow',{}).get('mean_margin',1)<0.20: out.append('weak-margin')
    for r in report.get('worst_shadow_pairs',[])[:25]:
        k=str(r.get('kind','')).lower(); g=float(r.get('goodScore',0)); b=float(r.get('badScore',0))
        if g-b<=0:
            if 'number' in k or 'numeric' in k: out.append('numeric-inversion')
            elif any(x in k for x in ('direction','polarity','contradiction')): out.append('polarity-inversion')
            elif 'entity' in k: out.append('entity-inversion')
            elif any(x in k for x in ('incomplete','qualifier','distractor')): out.append('completeness-inversion')
    return sorted(set(out))


def apply_semantic_recipe(reasons:list[str])->tuple[bool,str]:
    text=RELEASE.read_text(encoding='utf-8')
    # Only generalized, bounded recipes. Never touch benchmark/gates.
    if 'numeric-inversion' in reasons:
        pat=r'final_score=final_score\.min\(0\.74\);'
        if re.search(pat,text):
            new=re.sub(pat,'final_score=final_score.min(0.65);',text,count=1)
            if new!=text:
                RELEASE.write_text(new,encoding='utf-8'); return True,'tightened numeric-incomplete score cap 0.74→0.65'
    if 'completeness-inversion' in reasons:
        pat=r'g\*=0\.20;'
        if re.search(pat,text):
            new=re.sub(pat,'g*=0.12;',text,count=1)
            if new!=text:
                RELEASE.write_text(new,encoding='utf-8'); return True,'tightened generic binary-fragment penalty 0.20→0.12'
    if 'polarity-inversion' in reasons:
        pat=r'g\*=0\.06;'
        if re.search(pat,text):
            new=re.sub(pat,'g*=0.04;',text,count=1)
            if new!=text:
                RELEASE.write_text(new,encoding='utf-8'); return True,'tightened generic polarity conflict penalty 0.06→0.04'
    if 'entity-inversion' in reasons:
        pat=r'g\*=0\.02;'
        if re.search(pat,text):
            return False,'entity repair requires dedicated extraction evidence; no blind patch applied'
    return False,'no unused approved semantic recipe'


def hash_artifact(wasm:Path):
    h=hashlib.sha256(wasm.read_bytes()).hexdigest()
    out=ROOT/'telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt'
    out.write_text(f'{h}  {wasm.name}\nsource baseline commit: {BASELINE}\nchecker commit: {CHECKER_COMMIT}\nsource commit: {os.getenv("GITHUB_SHA", "local")}\n',encoding='utf-8')
    return h


def main()->int:
    ap=argparse.ArgumentParser(); ap.add_argument('--wasm',type=Path,default=WASM_DEFAULT); ap.add_argument('--rounds',type=int,default=2); ap.add_argument('--deep-rounds',type=int,default=8); ap.add_argument('--max-iterations',type=int,default=3); ap.add_argument('--existing-wasm',action='store_true'); ap.add_argument('--json',action='store_true')
    a=ap.parse_args(); a.wasm.parent.mkdir(parents=True,exist_ok=True); EVID.mkdir(parents=True,exist_ok=True)
    history=[]
    for iteration in range(1,a.max_iterations+1):
        rounds=a.rounds if iteration==1 else min(a.deep_rounds,16)
        try:
            if not a.existing_wasm or iteration>1: build(a.wasm)
            structural(a.wasm)
            generate(rounds)
            lab=run_lab(a.wasm)
            reasons=score_failures(lab)
            history.append({'iteration':iteration,'rounds':rounds,'lab':lab,'reasons':reasons})
            emit('doctor-history.json',{'iterations':history})
            if reasons:
                changed,detail=apply_semantic_recipe(reasons)
                emit(f'doctor-semantic-repair-{iteration}.json',{'reasons':reasons,'changed':changed,'detail':detail})
                if changed: continue
                # No safe semantic repair left: do not pretend green.
                print(json.dumps({'verdict':'RED','class':'candidate-semantic','reasons':reasons,'detail':detail},indent=2))
                return 2
            break
        except Exception as e:
            msg=str(e); history.append({'iteration':iteration,'error':msg}); emit('doctor-history.json',{'iterations':history})
            repaired,detail=repair_lab_infra(msg) if any(x in msg.lower() for x in ('syntax','enoent','node','unicode','rust')) else (False,'no infrastructure repair selected')
            emit(f'doctor-runtime-recovery-{iteration}.json',{'error':msg,'repaired':repaired,'detail':detail})
            if repaired: continue
            print(json.dumps({'verdict':'RED','class':'pipeline','error':msg,'history':history},indent=2))
            return 1
    else:
        print(json.dumps({'verdict':'RED','class':'iteration-budget','history':history},indent=2)); return 1

    try:
        # Full authoritative release path.
        run_node(ROOT/'telegraph/evaluation/track2-preflight.js',a.wasm,ROOT/'telegraph/evaluation/track2-benchmark-v2.json','preflight')
        run_node(ROOT/'telegraph/evaluation/track2-tournament.js',a.wasm,ROOT/'telegraph/evaluation/track2-benchmark-v2.json','tournament')
        run_node(ROOT/'telegraph/evaluation/track2-preflight.js',a.wasm,ROOT/'telegraph/evaluation/track2-benchmark-contract-v1.json','contract-preflight')
        run_node(ROOT/'telegraph/evaluation/track2-tournament.js',a.wasm,ROOT/'telegraph/evaluation/track2-benchmark-contract-v1.json','contract-tournament')
        prepare_checker()
        run_checker(a.wasm,CHECKER/'examples/hard.json','public-hard-json')
        mutate(a.wasm)
        live_risk(a.wasm)
        run_checker(a.wasm,ROOT/'telegraph/evaluation/track2-benchmark-v2.json','wazero')
        sha=hash_artifact(a.wasm)
        result={'verdict':'GREEN','sha256':sha,'wasm_bytes':a.wasm.stat().st_size,'history':history}
        emit('release-doctor-final.json',result)
        print(json.dumps(result,indent=2))
        return 0
    except Exception as e:
        emit('release-doctor-failure.json',{'verdict':'RED','error':str(e),'history':history})
        print(json.dumps({'verdict':'RED','class':'authoritative-gate','error':str(e),'history':history},indent=2)); return 1

if __name__=='__main__': raise SystemExit(main())
