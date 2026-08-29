const fs=require('fs');
const wasmPath=process.argv[2], casesPath=process.argv[3]||'telegraph/evaluation/track2-benchmark-v2.json';
if(!wasmPath) throw new Error('usage: node track2-preflight.js candidate.wasm [benchmark.json]');
const bytes=fs.readFileSync(wasmPath), data=JSON.parse(fs.readFileSync(casesPath,'utf8'));
(async()=>{
 const {module,instance}=await WebAssembly.instantiate(bytes,{}), e=instance.exports;
 for(const n of ['memory','alloc','dealloc','rank_answer','breakdown_answer']) if(!(n in e)) throw Error('missing export '+n);
 const imports=WebAssembly.Module.imports(module); if(imports.length) throw Error('imports present: '+JSON.stringify(imports));
 const enc=new TextEncoder();
 function score(q,gt,a){const bs=[enc.encode(q),enc.encode(gt),enc.encode(a)],ps=bs.map(b=>b.length?e.alloc(b.length):0);for(let i=0;i<3;i++)if(bs[i].length)new Uint8Array(e.memory.buffer,ps[i],bs[i].length).set(bs[i]);const r=e.rank_answer(ps[0],bs[0].length,ps[1],bs[1].length,ps[2],bs[2].length);for(let i=2;i>=0;i--)if(bs[i].length)e.dealloc(ps[i],bs[i].length);if(!Number.isFinite(r)||r<0||r>1)throw Error('invalid score '+r);return r;}
 const hard=[['empty answer',score('q','answer',''),0],['whitespace',score('q','answer',' \t\n\r'),0],['empty ground truth',score('q','','answer'),0]];
 for(const [n,v,w] of hard)if(v!==w)throw Error(`${n}: ${v} != ${w}`);
 let pairs=0,inversions=0,sum=0,worst=Infinity,vals=[],self=Infinity;
 for(const c of data.cases){
   const hs=c.answers.filter(x=>x.tier==='high'),ls=c.answers.filter(x=>x.tier==='low');
   const ss=score(c.question,c.ground_truth,c.ground_truth); self=Math.min(self,ss);
   for(const h of hs)for(const l of ls){const sh=score(c.question,c.ground_truth,h.text),sl=score(c.question,c.ground_truth,l.text),m=sh-sl;pairs++;sum+=m;worst=Math.min(worst,m);vals.push(sh,sl);if(!(m>0)){inversions++;console.error(JSON.stringify({case:c.id,question:c.question,high:h.label,highScore:sh,low:l.label,lowScore:sl,margin:m,diagnosis:'high answer did not outrank low answer'}));}}
 }
 const probes=[['unicode','正确答案 ✅ café 安全','正确答案 ✅ café 安全'],['long','valid '.repeat(16000),'valid '.repeat(15000)],['nul','answer','answer\0junk']];for(const p of probes)score(p[0],p[1],p[2]);
 const d1=score('q','same answer','same answer'),d2=score('q','same answer','same answer');if(d1!==d2)throw Error('determinism failed');
 const mean=vals.reduce((a,b)=>a+b,0)/vals.length,sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
 const out={wasmBytes:bytes.length,imports:imports.length,cases:data.cases.length,pairs,inversions,meanMargin:pairs?sum/pairs:0,worstMargin:worst,selfMatch:self,scoreStddev:sd};console.log(JSON.stringify(out,null,2));if(inversions)process.exit(2);
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
