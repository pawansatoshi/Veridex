#!/usr/bin/env node
import fs from 'node:fs';

const [goldenPath,candidatePath,benchmarkPath] = process.argv.slice(2);
if (!goldenPath || !candidatePath || !benchmarkPath) {
  console.error('usage: node track2-golden-differential.mjs GOLDEN.wasm CANDIDATE.wasm BENCHMARK.json');
  process.exit(2);
}

const benchmark = JSON.parse(fs.readFileSync(benchmarkPath,'utf8'));
const enc = new TextEncoder();
const load = async p => (await WebAssembly.instantiate(fs.readFileSync(p),{})).instance.exports;

const score = (e,q,gt,a) => {
  const Q=enc.encode(q), G=enc.encode(gt), A=enc.encode(a);
  const m=new Uint8Array(e.memory.buffer);
  const qp=e.alloc(Q.length), gp=e.alloc(G.length), ap=e.alloc(A.length);
  m.set(Q,qp); m.set(G,gp); m.set(A,ap);
  const s=e.rank_answer(qp,Q.length,gp,G.length,ap,A.length);
  e.dealloc(qp,Q.length); e.dealloc(gp,G.length); e.dealloc(ap,A.length);
  if(!Number.isFinite(s)||s<0||s>1) throw new Error(`invalid score ${s}`);
  return s;
};

const qcases=[];
for(const c of benchmark.cases||[]){
  const hi=(c.answers||[]).filter(a=>a.tier==='high');
  const lo=(c.answers||[]).filter(a=>a.tier==='low');
  if(!hi.length||!lo.length) continue;
  for(const h of hi) for(const l of lo){
    qcases.push({q:c.question,gt:c.ground_truth,high:h.text,low:l.text,label:`${c.question} | ${h.label} > ${l.label}`});
  }
}

const [gold,cand]=await Promise.all([load(goldenPath),load(candidatePath)]);
const rows=[]; let gInv=0,cInv=0;
for(const c of qcases){
  const gh=score(gold,c.q,c.gt,c.high), gl=score(gold,c.q,c.gt,c.low);
  const ch=score(cand,c.q,c.gt,c.high), cl=score(cand,c.q,c.gt,c.low);
  const gm=gh-gl, cm=ch-cl;
  rows.push({label:c.label,goldMargin:gm,candidateMargin:cm,goldHigh:gh,goldLow:gl,candidateHigh:ch,candidateLow:cl});
  if(gh<=gl) gInv++;
  if(ch<=cl) cInv++;
}

const sorted=a=>a.slice().sort((x,y)=>x-y);
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const quantile=(a,p)=>{const s=sorted(a);if(!s.length)return 0;const pos=(s.length-1)*p;const lo=Math.floor(pos),hi=Math.ceil(pos);if(lo===hi)return s[lo];return s[lo]+(s[hi]-s[lo])*(pos-lo);};
const gm=rows.map(x=>x.goldMargin), cm=rows.map(x=>x.candidateMargin);
const goldenMean=mean(gm), candidateMean=mean(cm);
const goldenP10=quantile(gm,0.10), candidateP10=quantile(cm,0.10);
const goldenWorst=Math.min(...gm), candidateWorst=Math.min(...cm);
const improved=rows.filter(r=>r.candidateMargin>r.goldMargin).length;
const regressed=rows.filter(r=>r.candidateMargin<r.goldMargin).length;
const severe=rows.filter(r=>r.candidateMargin+0.15<r.goldMargin).length;
const weak=rows.filter(r=>r.candidateMargin<0.05).length;

const out={
  cases:rows.length,
  golden:{inversions:gInv,meanMargin:goldenMean,p10Margin:goldenP10,worstMargin:goldenWorst},
  candidate:{inversions:cInv,meanMargin:candidateMean,p10Margin:candidateP10,worstMargin:candidateWorst},
  delta:{meanMargin:candidateMean-goldenMean,p10Margin:candidateP10-goldenP10,worstMargin:candidateWorst-goldenWorst,inversions:cInv-gInv},
  distribution:{improved,regressed,severeRegressions:severe,weakPairs:weak,severeRegressionRate:rows.length?severe/rows.length:0,weakPairRate:rows.length?weak/rows.length:0},
  regressedPairs:rows.filter(r=>r.candidateMargin+0.10<r.goldMargin).sort((a,b)=>(a.candidateMargin-a.goldMargin)-(b.candidateMargin-b.goldMargin)).slice(0,25),
};
console.log(JSON.stringify(out,null,2));

// Release gate policy:
// 1) no new ordering inversions relative to the 14.0 golden;
// 2) robust absolute internal target of mean margin >= 0.35;
// 3) p10 margin >= 0.05 so the tail is not collapsed;
// 4) no more than 5% severe (>0.15) pair regressions;
// 5) don't accept a broad collapse of the golden mean: candidate must retain
//    at least 90% of the golden mean or 0.50, whichever is stricter.
const fail =
  cInv > gInv ||
  candidateMean < 0.35 ||
  candidateP10 < 0.05 ||
  severe > Math.max(1, Math.floor(rows.length*0.05)) ||
  candidateMean < Math.max(0.50, goldenMean*0.90);

if(fail){
  console.error('golden differential gate: FAIL');
  process.exit(1);
}
console.error('golden differential gate: PASS');
