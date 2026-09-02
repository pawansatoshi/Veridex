#!/usr/bin/env node
import fs from 'node:fs';

const [goldenPath,candidatePath,benchmarkPath] = process.argv.slice(2);
if (!goldenPath || !candidatePath || !benchmarkPath) {
  console.error('usage: node track2-golden-differential.mjs GOLDEN.wasm CANDIDATE.wasm BENCHMARK.json');
  process.exit(2);
}
const benchmark=JSON.parse(fs.readFileSync(benchmarkPath,'utf8'));
const enc=new TextEncoder();
const load=async p=>(await WebAssembly.instantiate(fs.readFileSync(p),{})).instance.exports;
const score=(e,q,gt,a)=>{
  const Q=enc.encode(q),G=enc.encode(gt),A=enc.encode(a),m=new Uint8Array(e.memory.buffer);
  const qp=e.alloc(Q.length),gp=e.alloc(G.length),ap=e.alloc(A.length);
  m.set(Q,qp);m.set(G,gp);m.set(A,ap);
  const s=e.rank_answer(qp,Q.length,gp,G.length,ap,A.length);
  e.dealloc(qp,Q.length);e.dealloc(gp,G.length);e.dealloc(ap,A.length);
  if(!Number.isFinite(s)||s<0||s>1) throw new Error(`invalid score ${s}`);
  return s;
};
const qcases=[];
for(const c of benchmark.cases||[]){
  const hi=(c.answers||[]).filter(a=>a.tier==='high'),lo=(c.answers||[]).filter(a=>a.tier==='low');
  if(!hi.length||!lo.length) continue;
  for(const h of hi) for(const l of lo) qcases.push({q:c.question,gt:c.ground_truth,high:h.text,low:l.text,label:`${c.question} | ${h.label} > ${l.label}`});
}
const [gold,cand]=await Promise.all([load(goldenPath),load(candidatePath)]);
const rows=[]; let gInv=0,cInv=0;
for(const c of qcases){
  const gh=score(gold,c.q,c.gt,c.high),gl=score(gold,c.q,c.gt,c.low),ch=score(cand,c.q,c.gt,c.high),cl=score(cand,c.q,c.gt,c.low);
  rows.push({label:c.label,goldMargin:gh-gl,candidateMargin:ch-cl,goldHigh:gh,goldLow:gl,candidateHigh:ch,candidateLow:cl});
  if(gh<=gl)gInv++; if(ch<=cl)cInv++;
}
const margins=r=>r.map(x=>x.candidateMargin).sort((a,b)=>a-b);
const gm=r=>r.map(x=>x.goldMargin).sort((a,b)=>a-b);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const p10=a=>a[Math.max(0,Math.floor(a.length*0.10)-1)] ?? a[0];
const cm=margins(rows),gmm=gm(rows);
const out={cases:rows.length,golden:{inversions:gInv,meanMargin:mean(gmm),p10Margin:p10(gmm),worstMargin:gmm[0]},candidate:{inversions:cInv,meanMargin:mean(cm),p10Margin:p10(cm),worstMargin:cm[0]},delta:{meanMargin:mean(cm)-mean(gmm),p10Margin:p10(cm)-p10(gmm),worstMargin:cm[0]-gmm[0],inversions:cInv-gInv},regressedPairs:rows.filter(r=>r.candidateMargin+0.02<r.goldMargin).sort((a,b)=>(a.candidateMargin-a.goldMargin)-(b.candidateMargin-b.goldMargin)).slice(0,25)};
console.log(JSON.stringify(out,null,2));
const fail=out.candidate.inversions>out.golden.inversions || out.candidate.meanMargin<out.golden.meanMargin || out.candidate.p10Margin<out.golden.p10Margin;
if(fail) process.exit(1);
