#!/usr/bin/env python3
"""Standalone Track-2 release doctor v9.

Runs candidate search without the legacy nested v3/v5/v6 control flow. Each
candidate variant is rebuilt from the pinned baseline and measured against the
historical + sampled shadow corpus. The best measured variant is then subjected
to one full generated-corpus pass and the authoritative Telegraph gates.
No benchmark data or evaluator thresholds are modified.
"""
from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path
import track2_release_doctor_v3 as d
import track2_release_doctor_v5 as v5

ROOT=Path(__file__).resolve().parents[3]
LAB=ROOT/'telegraph/evaluation/lab'
RELEASE=ROOT/'telegraph/evaluation/neural/build_candidate_fast_release_v3.py'
FULL=LAB/'shadow_corpus.generated.json'
FAST=LAB/'shadow_corpus.fast.generated.json'
WASM_DEFAULT=ROOT/'telegraph/evaluation/veridex-track2-final.wasm'

LADDER=[
 ('0.035','0.18','moderate'),('0.030','0.16','moderate-strong'),
 ('0.025','0.14','strong'),('0.020','0.12','strong-cap'),
 ('0.017','0.10','aggressive'),('0.015','0.08','aggressive-cap'),
 ('0.012','0.06','very-aggressive'),('0.010','0.05','maximum')]

def emit(name,data):
 d.EVID.mkdir(parents=True,exist_ok=True)
 (d.EVID/name).write_text(data if isinstance(data,str) else json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8')

def set_material(factor,cap):
 text=RELEASE.read_text(encoding='utf-8')
 pat=r'const VR_MATERIAL_FACTOR:f32=[0-9.]+;\nconst VR_MATERIAL_CAP:f32=[0-9.]+;'
 new,n=re.subn(pat,f'const VR_MATERIAL_FACTOR:f32={factor};\nconst VR_MATERIAL_CAP:f32={cap};',text,count=1)
 if n!=1: raise RuntimeError('doctor-v9: material constants not found')
 RELEASE.write_text(new,encoding='utf-8')

def quality(report):
 s=report.get('shadow',{}); c=report.get('critical',{}); h=report.get('historical_replay',{})
 return (int(s.get('inversions',10**9)),int(c.get('inversions',10**9)),int(h.get('inversions',10**9)),-float(s.get('mean_margin',-1)),-float(s.get('p10_margin',-1)),-float(s.get('worst_margin',-1)),int(s.get('near_ties_lt_0_02',10**9)))

def lab_once(wasm,corpus):
 d.CORPUS=corpus
 try: return d.run_lab(wasm)
 except RuntimeError:
  if d.REPORT.exists(): return json.loads(d.REPORT.read_text(encoding='utf-8'))
  raise

def build_clean(wasm):
 d.build(wasm); d.structural(wasm)

def authoritative(wasm):
 d.gate('preflight',['node',str(d.PRE),str(wasm),str(d.PRIMARY)])
 d.gate('tournament',['node',str(d.TOUR),str(wasm),str(d.PRIMARY)])
 d.gate('contract-preflight',['node',str(d.PRE),str(wasm),str(d.CONTRACT)])
 d.gate('contract-tournament',['node',str(d.TOUR),str(wasm),str(d.CONTRACT)])
 d.prepare_checker()
 d.checker(wasm,d.CHECKER/'examples/hard.json','public-hard-json')
 d.gate('mutation',['node',str(d.MUT),str(wasm),str(d.PRIMARY)])
 d.gate('live-risk',['node',str(d.LIVE),str(wasm),str(d.PRIMARY)])
 d.checker(wasm,d.PRIMARY,'wazero')

def main():
 ap=argparse.ArgumentParser(); ap.add_argument('--wasm',type=Path,default=WASM_DEFAULT); ap.add_argument('--fast-limit',type=int,default=128); ap.add_argument('--json',action='store_true'); a=ap.parse_args()
 d.RELEASE=RELEASE
 original=RELEASE.read_text(encoding='utf-8')
 d.generate(1); v5._sample_full(a.fast_limit)
 history=[]
 best=None; winner=None; best_report=None
 candidates=[('current',None,None)]+[(lbl,f,c) for f,c,lbl in LADDER]
 for label,factor,cap in candidates:
  try:
   RELEASE.write_text(original,encoding='utf-8')
   if factor is not None: set_material(factor,cap)
   build_clean(a.wasm)
   report=lab_once(a.wasm,FAST)
   q=quality(report)
   row={'label':label,'factor':factor,'cap':cap,'quality':q,'report':report}
   history.append(row); emit('doctor-v9-candidate.json',row)
   if best is None or q<best: best=q; winner=row; best_report=report
  except Exception as exc:
   row={'label':label,'factor':factor,'cap':cap,'error':str(exc)};history.append(row);emit('doctor-v9-candidate-error.json',row)
 if winner is None: raise RuntimeError('doctor-v9: no buildable candidate')
 RELEASE.write_text(original,encoding='utf-8')
 if winner['factor'] is not None: set_material(winner['factor'],winner['cap'])
 build_clean(a.wasm)
 d.generate(1); d.CORPUS=FULL
 deep=lab_once(a.wasm,FULL); emit('deep-lab-final.json',deep)
 if deep.get('verdict')!='GREEN': raise RuntimeError('doctor-v9: winning candidate failed deep lab')
 authoritative(a.wasm)
 sha=hashlib.sha256(a.wasm.read_bytes()).hexdigest()
 result={'verdict':'GREEN','winner':{k:winner[k] for k in ('label','factor','cap','quality')},'deep':deep,'sha256':sha,'bytes':a.wasm.stat().st_size,'candidate_count':len(history)}
 (ROOT/'telegraph/evaluation/VERIDEX_TRACK2_FINAL_SHA256.txt').write_text(f'{sha}  {a.wasm.name}\nsource commit: {__import__("os").getenv("GITHUB_SHA","local")}\n',encoding='utf-8')
 emit('release-doctor-final.json',result); print(json.dumps(result,indent=2,ensure_ascii=False)); return 0

if __name__=='__main__': raise SystemExit(main())
