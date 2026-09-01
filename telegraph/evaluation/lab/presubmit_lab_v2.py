#!/usr/bin/env python3
"""Direct-corpus Track 2 pre-submit gate.

Scores exact GOOD/BAD pairs from the shadow generator. Scoring is chunked with
bounded subprocess timeouts so a pathological WASM input cannot hang the whole
lab; timed-out chunks are recursively isolated to identify the offending case.
"""
from __future__ import annotations
import argparse, hashlib, json, math, statistics, subprocess, sys
from pathlib import Path

NODE_SCORE_SCRIPT=r'''
import fs from 'node:fs';
const wasmPath=process.argv[1]; const mode=process.argv[2];
if(!wasmPath || !mode) throw new Error(`invalid scorer argv: wasm=${wasmPath} mode=${mode}`);
const wasm=fs.readFileSync(wasmPath); const rows=JSON.parse(fs.readFileSync(0,'utf8'));
const {module,instance}=await WebAssembly.instantiate(wasm,{}); const e=instance.exports;
for(const n of ['memory','alloc','dealloc','rank_answer']) if(!(n in e)) throw new Error(`missing export ${n}`);
if(WebAssembly.Module.imports(module).length) throw new Error('imports present');
const enc=new TextEncoder();
function s(q,g,a){const qb=enc.encode(q),gb=enc.encode(g),ab=enc.encode(a);const qp=e.alloc(qb.length),gp=e.alloc(gb.length),ap=e.alloc(ab.length);try{const m=new Uint8Array(e.memory.buffer);for(const[p,b]of[[qp,qb],[gp,gb],[ap,ab]]){if(p<0||p>m.length||b.length>m.length-p)throw new Error('memory bounds');m.set(b,p);}const v=e.rank_answer(qp,qb.length,gp,gb.length,ap,ab.length);if(!Number.isFinite(v)||v<0||v>1)throw new Error(`invalid score ${v}`);return v}finally{e.dealloc(ap,ab.length);e.dealloc(gp,gb.length);e.dealloc(qp,qb.length)}}
const out=[];for(const r of rows){if(mode==='pairs')out.push({...r,goodScore:s(r.question,r.ground_truth,r.good),badScore:s(r.question,r.ground_truth,r.bad)});else if(mode==='invariance')out.push({...r,referenceScore:s(r.question,r.ground_truth,r.reference),variantScore:s(r.question,r.ground_truth,r.variant)});else throw new Error(`unknown scoring mode: ${mode}`);}console.log(JSON.stringify(out));
'''


def run(cmd, input_text=None, timeout=1800):
    return subprocess.run(cmd, input=input_text, text=True, capture_output=True, timeout=timeout, check=False)


def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''): h.update(chunk)
    return h.hexdigest()


def structural(path):
    p=run(['wasm-validate',str(path)],timeout=30)
    if p.returncode!=0: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or 'wasm-validate failed')
    p=run(['wasm-objdump','-x',str(path)],timeout=30)
    if p.returncode!=0: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or 'wasm-objdump failed')
    t=p.stdout
    imports=len(__import__('re').findall(r'^Import\[',t,__import__('re').MULTILINE)) if 'Import[' in t else 0
    exports=sorted(set(__import__('re').findall(r'- func\[\d+\] <([^>]+)>',t)))
    return {'bytes':path.stat().st_size,'imports':imports,'exports':exports}


def _score_chunk(wasm, records, mode, timeout):
    payload=json.dumps(records,ensure_ascii=False)
    p=run(['node','--input-type=module','-e',NODE_SCORE_SCRIPT,str(wasm),mode],input_text=payload,timeout=timeout)
    if p.returncode!=0: raise RuntimeError(p.stderr.strip() or p.stdout.strip() or 'candidate scorer failed')
    try:return json.loads(p.stdout)
    except json.JSONDecodeError as e:raise RuntimeError(f'candidate scorer returned invalid JSON: {e}') from e


def score_records(wasm, records, mode='pairs'):
    if not records:return []
    chunk_size=2048
    timeout=240
    out=[]
    def score_range(start,end):
        batch=records[start:end]
        try:
            return _score_chunk(wasm,batch,mode,timeout)
        except subprocess.TimeoutExpired:
            if end-start==1:
                r=batch[0]
                raise RuntimeError(f'WASM scorer timeout at corpus index {start}: kind={r.get("kind","unknown")} source={r.get("source","unknown")} question={r.get("question","")[:180]}')
            mid=start+(end-start)//2
            return score_range(start,mid)+score_range(mid,end)
        except RuntimeError as e:
            if end-start==1: raise RuntimeError(f'WASM scorer failure at corpus index {start}: {e}')
            mid=start+(end-start)//2
            try:return score_range(start,mid)+score_range(mid,end)
            except Exception as left_error:
                raise RuntimeError(f'WASM scorer failed in corpus range [{start},{end}): {left_error}') from left_error
    for start in range(0,len(records),chunk_size):
        end=min(len(records),start+chunk_size)
        out.extend(score_range(start,end))
    return out


def summary(rows):
    ms=sorted(r['goodScore']-r['badScore'] for r in rows);n=len(ms)
    return {'pairs':n,'inversions':sum(x<=0 for x in ms),'mean_margin':statistics.fmean(ms) if ms else 0.0,'median_margin':statistics.median(ms) if ms else 0.0,'p10_margin':ms[max(0,math.floor(n*.10))] if n else 0.0,'p5_margin':ms[max(0,math.floor(n*.05))] if n else 0.0,'worst_margin':ms[0] if ms else 0.0,'near_ties_lt_0_02':sum(0<x<.02 for x in ms),'near_ties_lt_0_05':sum(0<x<.05 for x in ms)}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('wasm',type=Path);ap.add_argument('--corpus',type=Path,required=True);ap.add_argument('--historical',type=Path,default=Path(__file__).with_name('historical_failures.json'));ap.add_argument('--strict',action='store_true');ap.add_argument('--json',action='store_true');ap.add_argument('--out',type=Path);args=ap.parse_args()
    s=structural(args.wasm)
    if s['imports']!=0: print('RED: imports present'); return 2
    if s['bytes']>33_554_432: print('RED: artifact exceeds 32 MiB'); return 2
    corpus=json.loads(args.corpus.read_text())['cases']
    hist=json.loads(args.historical.read_text())['cases']
    scored=score_records(args.wasm,corpus,'pairs'); hscored=score_records(args.wasm,hist,'pairs') if hist else []
    sh=summary(scored); hs=summary(hscored)
    critical=[r for r in scored if r.get('critical')]
    cs=summary(critical) if critical else {'pairs':0,'inversions':0,'mean_margin':0,'p10_margin':0,'worst_margin':0}
    inv_corpus=json.loads(args.corpus.read_text()).get('invariance',[])
    inv=score_records(args.wasm,inv_corpus,'invariance') if inv_corpus else []
    invd=[abs(r['referenceScore']-r['variantScore']) for r in inv]
    invariant={'variants':len(invd),'mean_abs_delta':statistics.fmean(invd) if invd else 0.0,'max_abs_delta':max(invd,default=0.0),'severe_changes_gt_0_10':sum(x>.10 for x in invd)}
    verdict='GREEN'
    if sh['inversions'] or hs['inversions'] or cs['inversions']: verdict='RED'
    elif sh['mean_margin']<.20 or sh['p10_margin']<.05 or invariant['max_abs_delta']>.20: verdict='YELLOW'
    result={'verdict':verdict,'artifact':{**s,'sha256':sha256(args.wasm)},'corpus':{'path':str(args.corpus),'pairs':len(corpus),'historical_pairs':len(hist),'critical_pairs':len(critical)},'shadow':sh,'critical':cs,'historical_replay':hs,'invariance':invariant,'policy':{'mean_margin_target':.20,'p10_target':.05,'required_inversions':0,'hidden_stage2_predictable':False},'worst_pairs':sorted(scored,key=lambda r:r['goodScore']-r['badScore'])[:30]}
    if args.out: args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False) if args.json else f"VERDICT={verdict} pairs={sh['pairs']} inv={sh['inversions']} mean={sh['mean_margin']:.6f} p10={sh['p10_margin']:.6f} worst={sh['worst_margin']:.6f} critical={cs['pairs']}/{cs['inversions']}")
    return 0 if verdict=='GREEN' or not args.strict else 1
if __name__=='__main__': raise SystemExit(main())
