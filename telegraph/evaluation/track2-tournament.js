const fs = require('fs');
const wasmPath = process.argv[2], casesPath = process.argv[3];
const wasm = fs.readFileSync(wasmPath); const data = JSON.parse(fs.readFileSync(casesPath,'utf8'));
(async()=>{
  const {instance}=await WebAssembly.instantiate(wasm,{}), e=instance.exports, enc=new TextEncoder();
  for(const n of ['memory','alloc','dealloc','rank_answer','breakdown_answer']) if(!(n in e)) throw Error('missing export '+n);
  function score(q,gt,a){const bs=[enc.encode(q),enc.encode(gt),enc.encode(a)], ps=bs.map(b=>b.length?e.alloc(b.length):0);for(let i=0;i<3;i++)if(bs[i].length)new Uint8Array(e.memory.buffer,ps[i],bs[i].length).set(bs[i]);const r=e.rank_answer(ps[0],bs[0].length,ps[1],bs[1].length,ps[2],bs[2].length);for(let i=2;i>=0;i--)if(bs[i].length)e.dealloc(ps[i],bs[i].length);if(!Number.isFinite(r)||r<0||r>1)throw Error('invalid score '+r);return r;}
  if(score('q','answer','')!==0||score('q','answer',' \t\n')!==0||score('q','','answer')!==0)throw Error('hard zero-input gate failed');
  let pairs=0,inversions=0,sum=0,worst=Infinity;
  for(const c of data.cases){const hs=c.answers.filter(x=>x.tier==='high'),ls=c.answers.filter(x=>x.tier==='low');for(const h of hs)for(const l of ls){const sh=score(c.question,c.ground_truth,h.text),sl=score(c.question,c.ground_truth,l.text),m=sh-sl;pairs++;sum+=m;worst=Math.min(worst,m);if(!(m>0)){inversions++;console.error(JSON.stringify({question:c.question,high:h.label,highScore:sh,low:l.label,lowScore:sl}));}}}
  const longTruth='valid '.repeat(16000), longAnswer='valid '.repeat(15000);score('long',longTruth,longAnswer);score('unicode','正确答案 ✅ café 安全','正确答案 ✅ café 安全');
  const d1=score('q','same answer','same answer'),d2=score('q','same answer','same answer');if(d1!==d2)throw Error('determinism failed');
  const out={cases:data.cases.length,pairs,inversions,meanMargin:sum/pairs,worstMargin:worst};console.log(JSON.stringify(out,null,2));if(inversions)process.exit(2);
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
