import fs from 'node:fs';

const [,, wasmPath, benchmarkPath = 'telegraph/evaluation/track2-benchmark-v2.json'] = process.argv;
if (!wasmPath) throw new Error('usage: node track2-live-risk-stress.mjs candidate.wasm [benchmark.json]');

const wasm = fs.readFileSync(wasmPath);
const seed = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
const { module, instance } = await WebAssembly.instantiate(wasm, {});
const e = instance.exports;
for (const n of ['memory','alloc','dealloc','rank_answer','breakdown_answer']) {
  if (!(n in e)) throw new Error(`missing export ${n}`);
}
if (WebAssembly.Module.imports(module).length) throw new Error('imports present');

const enc = new TextEncoder();
function score(q, gt, answer) {
  const qb = enc.encode(q), gb = enc.encode(gt), ab = enc.encode(answer);
  const qp = e.alloc(qb.length), gp = e.alloc(gb.length), ap = e.alloc(ab.length);
  try {
    if (!qp || !gp || !ap) throw new Error('allocation failed');
    const mem = new Uint8Array(e.memory.buffer);
    for (const [p, b] of [[qp, qb], [gp, gb], [ap, ab]]) {
      if (p < 0 || p > mem.length || b.length > mem.length - p) throw new Error('linear-memory bounds failure');
      mem.set(b, p);
    }
    const s = e.rank_answer(qp, qb.length, gp, gb.length, ap, ab.length);
    if (!Number.isFinite(s) || s < 0 || s > 1) throw new Error(`invalid score ${s}`);
    return s;
  } finally {
    e.dealloc(ap, ab.length); e.dealloc(gp, gb.length); e.dealloc(qp, qb.length);
  }
}

const swaps = [
  ['approved','rejected'], ['authorized','unauthorized'], ['allowed','blocked'],
  ['confirmed','denied'], ['safe','unsafe'], ['legitimate','fraudulent'],
  ['genuine','counterfeit'], ['increased','decreased'], ['increase','decrease'],
  ['rose','fell'], ['rising','falling'], ['positive','negative'],
  ['bullish','bearish'], ['compromised','secure'], ['trusted','malicious']
];
const entities = [
  ['Apple','Microsoft'], ['Ethereum','Solana'], ['Coinbase','Binance'],
  ['Kraken','Coinbase'], ['OpenAI','Google']
];
const numberRe = /\b(\d+(?:[.,]\d+)?)\b/g;
function mutateNumber(text, delta = 1) {
  return text.replace(numberRe, (_, n) => {
    const x = Number(n.replace(/,/g, ''));
    return Number.isFinite(x) ? String(x + delta) : n;
  });
}
function flip(text) {
  for (const [a, b] of swaps) {
    const re = new RegExp(`\\b${a}\\b`, 'i');
    if (re.test(text)) return text.replace(re, b);
  }
  return text + ' not';
}
function swapEntity(text) {
  let out = text;
  for (const [a, b] of entities) {
    const ta = `__VR_${a.replace(/[^A-Za-z0-9]/g, '_')}__`;
    const tb = `__VR_${b.replace(/[^A-Za-z0-9]/g, '_')}__`;
    out = out.replace(new RegExp(`\\b${a}\\b`, 'g'), ta).replace(new RegExp(`\\b${b}\\b`, 'g'), tb);
    out = out.replaceAll(ta, b).replaceAll(tb, a);
  }
  return out === text ? text + ' ' + 'not' : out;
}
function distract(text) {
  return `${text} unrelated background information about another topic and entity`;
}

let pairs = 0, inversions = 0;
let margins = [];
const diagnostics = [];
for (const c of seed.cases) {
  const goodAnswer = c.answers.find(x => x.tier === 'high')?.text;
  if (!goodAnswer) continue;
  const good = score(c.question, c.ground_truth, goodAnswer);
  const variants = [
    ['direction', flip(goodAnswer)],
    ['number', mutateNumber(goodAnswer)],
    ['entity', swapEntity(goodAnswer)],
    ['distractor', distract(goodAnswer)],
    ['double-mutation', flip(mutateNumber(goodAnswer))],
    ['entity-number', swapEntity(mutateNumber(goodAnswer, 3))],
  ];
  for (const [kind, badAnswer] of variants) {
    if (badAnswer === goodAnswer) continue;
    const bad = score(c.question, c.ground_truth, badAnswer);
    const margin = good - bad;
    pairs++;
    margins.push(margin);
    if (!(margin > 0)) {
      inversions++;
      if (diagnostics.length < 25) diagnostics.push({kind, question:c.question, ground_truth:c.ground_truth, good:goodAnswer, goodScore:good, bad:badAnswer, badScore:bad, margin});
    }
  }
}

margins.sort((a,b) => a-b);
const meanMargin = margins.reduce((a,b) => a+b,0) / Math.max(1,margins.length);
const p10Margin = margins[Math.max(0, Math.floor(margins.length * 0.10))] ?? 0;
const worstMargin = margins[0] ?? 0;
const result = {
  seedCases: seed.cases.length,
  generatedPairs: pairs,
  inversions,
  meanMargin,
  p10Margin,
  worstMargin,
  targetMeanMargin: 0.35,
  targetP10Margin: 0.05,
  diagnostics,
};
console.log(JSON.stringify(result, null, 2));
if (inversions > 0 || meanMargin < 0.35 || p10Margin < 0.05) process.exit(2);
