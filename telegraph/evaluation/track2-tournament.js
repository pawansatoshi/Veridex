import fs from 'node:fs';

const wasmPath = process.argv[2];
const casesPath = process.argv[3];
if (!wasmPath || !casesPath) throw new Error('usage: node track2-tournament.js candidate.wasm benchmark.json');

const wasm = fs.readFileSync(wasmPath);
const data = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const module = await WebAssembly.compile(wasm);
if (WebAssembly.Module.imports(module).length) throw new Error('WASM imports present');
const { instance } = await WebAssembly.instantiate(module, {});
const e = instance.exports;
const required = ['memory', 'alloc', 'dealloc', 'rank_answer', 'breakdown_answer'];
for (const n of required) if (!(n in e)) throw new Error(`missing export ${n}`);
const enc = new TextEncoder();

function score(q, gt, a) {
  const bs = [enc.encode(q), enc.encode(gt), enc.encode(a)];
  const ps = bs.map(b => b.length ? e.alloc(b.length) : 0);
  for (let i = 0; i < 3; i++) {
    if (!bs[i].length) continue;
    if (!ps[i]) throw new Error(`alloc failed for arg ${i}`);
    const mem = new Uint8Array(e.memory.buffer);
    if (ps[i] + bs[i].length > mem.length) throw new Error('input exceeds linear memory');
    mem.set(bs[i], ps[i]);
  }
  const r = e.rank_answer(ps[0], bs[0].length, ps[1], bs[1].length, ps[2], bs[2].length);
  for (let i = 2; i >= 0; i--) if (bs[i].length) e.dealloc(ps[i], bs[i].length);
  if (!Number.isFinite(r) || r < 0 || r > 1) throw new Error(`invalid score ${r}`);
  return r;
}

if (score('q', 'answer', '') !== 0 || score('q', 'answer', ' \t\n') !== 0 || score('q', '', 'answer') !== 0) {
  throw new Error('hard zero-input gate failed');
}
if (score('q', 'answer', 'answer') !== 1) throw new Error('exact self-match gate failed');

let pairs = 0, inversions = 0, sum = 0, worst = Infinity;
const failures = [];

for (const c of data.cases) {
  const highs = c.answers.filter(x => x.tier === 'high');
  const lows = c.answers.filter(x => x.tier === 'low');
  for (const high of highs) {
    for (const low of lows) {
      const sh = score(c.question, c.ground_truth, high.text);
      const sl = score(c.question, c.ground_truth, low.text);
      const margin = sh - sl;
      pairs++;
      sum += margin;
      worst = Math.min(worst, margin);
      if (!(margin > 0)) {
        inversions++;
        failures.push({
          id: c.id,
          question: c.question,
          groundTruth: c.ground_truth,
          high: high.label,
          highScore: sh,
          low: low.label,
          lowScore: sl,
          margin,
        });
      }
    }
  }
}

// Deterministic repeat test.
const d1 = score('q', 'same answer', 'same answer');
const d2 = score('q', 'same answer', 'same answer');
if (d1 !== d2) throw new Error('determinism failed');

// Fresh-instance determinism.
const second = await WebAssembly.instantiate(module, {});
const e2 = second.instance.exports;
function freshScore() {
  const q = enc.encode('q'), gt = enc.encode('same answer'), a = enc.encode('same answer');
  const pq = e2.alloc(q.length), pg = e2.alloc(gt.length), pa = e2.alloc(a.length);
  new Uint8Array(e2.memory.buffer, pq, q.length).set(q);
  new Uint8Array(e2.memory.buffer, pg, gt.length).set(gt);
  new Uint8Array(e2.memory.buffer, pa, a.length).set(a);
  const r = e2.rank_answer(pq, q.length, pg, gt.length, pa, a.length);
  e2.dealloc(pa, a.length); e2.dealloc(pg, gt.length); e2.dealloc(pq, q.length);
  return r;
}
if (freshScore() !== d1) throw new Error('fresh-instance determinism failed');

// UTF-8/long/NUL smoke checks.
score('unicode', '正确答案 ✅ café 安全', '正确答案 ✅ café 安全');
score('long', 'valid '.repeat(16000), 'valid '.repeat(15000));
score('nul', 'answer', 'answer\0junk');

// Validate breakdown on a representative non-empty input.
{
  const q = enc.encode('q'), gt = enc.encode('same answer'), a = enc.encode('same answer');
  const pq = e.alloc(q.length), pg = e.alloc(gt.length), pa = e.alloc(a.length);
  new Uint8Array(e.memory.buffer, pq, q.length).set(q);
  new Uint8Array(e.memory.buffer, pg, gt.length).set(gt);
  new Uint8Array(e.memory.buffer, pa, a.length).set(a);
  const bp = e.breakdown_answer(pq, q.length, pg, gt.length, pa, a.length);
  if (!bp) throw new Error('breakdown_answer returned 0');
  const view = new DataView(e.memory.buffer, bp, 20);
  for (let i = 0; i < 5; i++) {
    const v = view.getFloat32(i * 4, true);
    if (!Number.isFinite(v) || v < 0 || v > 1) throw new Error(`invalid breakdown slot ${i}: ${v}`);
  }
  e.dealloc(pa, a.length); e.dealloc(pg, gt.length); e.dealloc(pq, q.length);
}

const out = {
  cases: data.cases.length,
  pairs,
  inversions,
  meanMargin: pairs ? sum / pairs : 0,
  worstMargin: Number.isFinite(worst) ? worst : 0,
  diagnosticFailures: failures,
};
console.log(JSON.stringify(out, null, 2));
if (inversions) process.exit(2);
