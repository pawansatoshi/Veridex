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
const categoryOf=label=>{
  const m=label.match(/\|\s*([a-z0-9_]+)-(?:high|low)\s*>/i);
  return m?m[1]:'unknown';
};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const percentile=(a,p)=>{
  if(!a.length)return 0;
  const s=[...a].sort((x,y)=>x-y),i=Math.min(s.length-1,Math.max(0,Math.ceil(p*s.length)-1));
  return s[i];
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
  const gm=gh-gl,cm=ch-cl;
  rows.push({label:c.label,category:categoryOf(c.label),goldMargin:gm,candidateMargin:cm,goldHigh:gh,goldLow:gl,candidateHigh:ch,candidateLow:cl});
  if(gh<=gl)gInv++; if(ch<=cl)cInv++;
}

const margins=rows.map(x=>x.candidateMargin);
const goldMargins=rows.map(x=>x.goldMargin);
const summarize=rs=>{
  const ms=rs.map(x=>x.candidateMargin), arr=rs.map(x=>x.candidateHigh-x.candidateLow);
  const collapsed=rs.filter(x=>Math.abs(x.candidateMargin)<0.05).length;
  const inv=rs.filter(x=>x.candidateMargin<=0).length;
  return {pairs:rs.length,inversions:inv,meanMargin:mean(ms),p10Margin:percentile(ms,0.10),medianMargin:percentile(ms,0.50),worstMargin:ms.length?Math.min(...ms):0,bestMargin:ms.length?Math.max(...ms):0,nearCollapseUnder0p05:collapsed};
};
const categoryMap=new Map();
for(const r of rows){if(!categoryMap.has(r.category))categoryMap.set(r.category,[]);categoryMap.get(r.category).push(r);}
const candidateByCategory=Object.fromEntries([...categoryMap.entries()].sort().map(([k,v])=>[k,summarize(v)]));
const goldenByCategory=Object.fromEntries([...categoryMap.entries()].sort().map(([k,v])=>{
  const ms=v.map(x=>x.goldMargin);return [k,{pairs:v.length,inversions:v.filter(x=>x.goldMargin<=0).length,meanMargin:mean(ms),p10Margin:percentile(ms,0.10),medianMargin:percentile(ms,0.50),worstMargin:ms.length?Math.min(...ms):0,bestMargin:ms.length?Math.max(...ms):0,nearCollapseUnder0p05:v.filter(x=>Math.abs(x.goldMargin)<0.05).length}];
}));

const regressions=rows.filter(r=>r.candidateMargin+0.02<r.goldMargin)
  .sort((a,b)=>(a.candidateMargin-a.goldMargin)-(b.candidateMargin-b.goldMargin)).slice(0,30);
const out={
  cases:rows.length,
  golden:{inversions:gInv,meanMargin:mean(goldMargins),p10Margin:percentile(goldMargins,0.10),medianMargin:percentile(goldMargins,0.50),worstMargin:goldMargins.length?Math.min(...goldMargins):0,bestMargin:goldMargins.length?Math.max(...goldMargins):0},
  candidate:{inversions:cInv,meanMargin:mean(margins),p10Margin:percentile(margins,0.10),medianMargin:percentile(margins,0.50),worstMargin:margins.length?Math.min(...margins):0,bestMargin:margins.length?Math.max(...margins):0,nearCollapseUnder0p05:margins.filter(x=>Math.abs(x)<0.05).length},
  delta:{meanMargin:mean(margins)-mean(goldMargins),p10Margin:percentile(margins,0.10)-percentile(goldMargins,0.10),medianMargin:percentile(margins,0.50)-percentile(goldMargins,0.50),worstMargin:(margins.length?Math.min(...margins):0)-(goldMargins.length?Math.min(...goldMargins):0),inversions:cInv-gInv},
  goldenByCategory,
  candidateByCategory,
  regressedPairs:regressions
};
console.log(JSON.stringify(out,null,2));
const fail=out.candidate.inversions>out.golden.inversions || out.candidate.meanMargin<out.golden.meanMargin || out.candidate.p10Margin<out.golden.p10Margin;
if(fail) process.exit(1);
