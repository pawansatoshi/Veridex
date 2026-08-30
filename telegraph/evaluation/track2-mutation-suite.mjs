import fs from 'node:fs';

const [,, wasmPath, benchmarkPath = 'telegraph/evaluation/track2-benchmark-v2.json'] = process.argv;
if (!wasmPath) throw new Error('usage: node track2-mutation-suite.mjs candidate.wasm [benchmark.json]');

const wasm = fs.readFileSync(wasmPath);
const seed = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
const { module, instance } = await WebAssembly.instantiate(wasm, {});
const e = instance.exports;
for (const n of ['memory','alloc','dealloc','rank_answer','breakdown_answer']) if (!(n in e)) throw new Error(`missing export ${n}`);
if (WebAssembly.Module.imports(module).length) throw new Error('imports present');

const enc = new TextEncoder();
function score(q, gt, a) {
  const bs = [enc.encode(q), enc.encode(gt), enc.encode(a)];
  const ps = bs.map(b => b.length ? e.alloc(b.length) : 0);
  for (let i=0;i<3;i++) if (bs[i].length) new Uint8Array(e.memory.buffer, ps[i], bs[i].length).set(bs[i]);
  const r = e.rank_answer(ps[0],bs[0].length,ps[1],bs[1].length,ps[2],bs[2].length);
  for (let i=2;i>=0;i--) if (bs[i].length) e.dealloc(ps[i],bs[i].length);
  if (!Number.isFinite(r) || r < 0 || r > 1) throw new Error(`invalid score ${r}`);
  return r;
}

const replacements = [
  ['increased','decreased'], ['increase','decrease'], ['rose','fell'], ['rising','falling'],
  ['positive','negative'], ['bullish','bearish'], ['safe','unsafe'], ['legitimate','fraudulent'],
  ['genuine','counterfeit'], ['approved','rejected'], ['authorized','unauthorized'],
  ['allowed','blocked'], ['confirmed','denied'], ['true','false'], ['yes','no']
];

const numberRe = /\b(\d+(?:[.,]\d+)?)\b/g;
function mutateNumber(text) {
  return text.replace(numberRe, (_, n) => {
    const x = Number(n.replace(/,/g,''));
    return Number.isFinite(x) ? String(x + (x === 0 ? 1 : 1)) : n;
  });
}
function mutateEntity(text) {
  return text
    .replace(/\bApple\b/g, 'Microsoft')
    .replace(/\bMicrosoft\b/g, 'Apple')
    .replace(/\bEthereum\b/g, 'Solana')
    .replace(/\bSolana\b/g, 'Ethereum')
    .replace(/\bCoinbase\b/g, 'Binance')
    .replace(/\bBinance\b/g, 'Coinbase');
}
function flip(text) {
  let out = text;
  for (const [a,b] of replacements) {
    const re = new RegExp(`\\b${a}\\b`, 'i');
    if (re.test(out)) return out.replace(re, b);
  }
  return out;
}

let tested = 0;
let failures = 0;
const diagnostics = [];

for (const c of seed.cases) {
  const highs = c.answers.filter(x => x.tier === 'high');
  const lows = c.answers.filter(x => x.tier === 'low');
  const baseHigh = highs[0]?.text;
  const baseLow = lows[0]?.text;
  if (!baseHigh || !baseLow) continue;

  const mutants = [
    ['number-mutation', mutateNumber(baseHigh)],
    ['entity-mutation', mutateEntity(baseHigh)],
    ['direction-flip', flip(baseHigh)],
    ['case-punctuation', baseHigh.toUpperCase() + '!!!'],
    ['undercomplete', baseHigh.split(/\s+/).slice(0, Math.max(1, Math.ceil(baseHigh.split(/\s+/).length/2))).join(' ')],
  ];

  const good = score(c.question, c.ground_truth, baseHigh);
  for (const [kind, mutant] of mutants) {
    if (mutant === baseHigh) continue;
    const bad = score(c.question, c.ground_truth, mutant);
    tested++;
    if (!(good > bad || (kind === 'case-punctuation' && good >= bad))) {
      failures++;
      diagnostics.push({id:c.id, kind, question:c.question, ground_truth:c.ground_truth, good:baseHigh, goodScore:good, mutant, mutantScore:bad});
    }
  }

  for (const low of lows) {
    const sl = score(c.question, c.ground_truth, low.text);
    tested++;
    if (!(good > sl)) {
      failures++;
      diagnostics.push({id:c.id, kind:'seed-low', question:c.question, ground_truth:c.ground_truth, good:baseHigh, goodScore:good, bad:low.text, badScore:sl});
    }
  }
}

console.log(JSON.stringify({seedCases:seed.cases.length,tested,failures,diagnostics}, null, 2));
if (failures) process.exit(2);
