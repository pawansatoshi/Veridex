import fs from 'node:fs';

const wasmPath = process.argv[2];
const casesPath = process.argv[3];
if (!wasmPath || !casesPath) throw new Error('usage: node track2-tournament.js candidate.wasm benchmark.json');

const startedAt = performance.now();
const wasm = fs.readFileSync(wasmPath);
const data = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const module = await WebAssembly.compile(wasm);
if (WebAssembly.Module.imports(module).length) throw new Error('WASM imports present');
const instance = await WebAssembly.instantiate(module, {});
const e = instance.exports;
const required = ['memory', 'alloc', 'dealloc', 'rank_answer', 'breakdown_answer'];
for (const n of required) if (!(n in e)) throw new Error(`missing export ${n}`);
const enc = new TextEncoder();

function checkedRange(mem, ptr, len, label) {
  if (!Number.isInteger(ptr) || ptr < 0 || !Number.isInteger(len) || len < 0 || ptr > mem.length || len > mem.length - ptr) throw new Error(`${label}: invalid linear-memory range ${ptr}+${len} > ${mem.length}`);
}

function score(q, gt, a, wantBreakdown = false) {
  const bs = [enc.encode(q), enc.encode(gt), enc.encode(a)];
  const ps = bs.map(b => b.length ? e.alloc(b.length) : 0);
  try {
    for (let i = 0; i < 3; i++) {
      if (!bs[i].length) continue;
      if (!ps[i]) throw new Error(`alloc failed for arg ${i}`);
      const mem = new Uint8Array(e.memory.buffer);
      checkedRange(mem, ps[i], bs[i].length, `arg ${i}`);
      mem.set(bs[i], ps[i]);
    }
    const r = e.rank_answer(ps[0], bs[0].length, ps[1], bs[1].length, ps[2], bs[2].length);
    if (!Number.isFinite(r) || r < 0 || r > 1) throw new Error(`invalid score ${r}`);
    let breakdown = null;
    if (wantBreakdown) {
      const bp = e.breakdown_answer(ps[0], bs[0].length, ps[1], bs[1].length, ps[2], bs[2].length);
      const mem = new Uint8Array(e.memory.buffer);
      checkedRange(mem, bp, 20, 'breakdown');
      const view = new DataView(e.memory.buffer, bp, 20);
      breakdown = Array.from({ length: 5 }, (_, i) => view.getFloat32(i * 4, true));
      if (breakdown.some(v => !Number.isFinite(v) || v < 0 || v > 1)) throw new Error(`invalid breakdown ${JSON.stringify(breakdown)}`);
      if (Math.abs(breakdown[4] - r) > 1e-6) throw new Error(`breakdown final ${breakdown[4]} != rank ${r}`);
    }
    return { score: r, breakdown };
  } finally {
    for (let i = 2; i >= 0; i--) if (bs[i].length && ps[i]) e.dealloc(ps[i], bs[i].length);
  }
}

if (score('q', 'answer', '').score !== 0 || score('q', 'answer', ' \t\n').score !== 0 || score('q', '', 'answer').score !== 0) throw new Error('hard zero-input gate failed');
const exact = score('q', 'answer', 'answer', true);
if (exact.score !== 1 || exact.breakdown?.[4] !== 1) throw new Error('exact self-match/breakdown gate failed');

let pairs = 0, wins = 0, losses = 0, ties = 0, inversions = 0, sum = 0, worst = Infinity, best = -Infinity;
const margins = [], values = [], failures = [];
for (const c of data.cases) {
  const highs = c.answers.filter(x => x.tier === 'high');
  const lows = c.answers.filter(x => x.tier === 'low');
  for (const high of highs) for (const low of lows) {
    const sh = score(c.question, c.ground_truth, high.text, true);
    const sl = score(c.question, c.ground_truth, low.text, true);
    const margin = sh.score - sl.score;
    pairs++; sum += margin; margins.push(margin); values.push(sh.score, sl.score); worst = Math.min(worst, margin); best = Math.max(best, margin);
    if (margin > 0) wins++; else if (margin < 0) { losses++; inversions++; } else ties++;
    if (!(margin > 0)) failures.push({ id:c.id, question:c.question, groundTruth:c.ground_truth, high:high.label, highAnswer:high.text, highScore:sh.score, highComponents:sh.breakdown, low:low.label, lowAnswer:low.text, lowScore:sl.score, lowComponents:sl.breakdown, margin, likelyFailureMode:margin === 0 ? 'tie: insufficient separation' : 'inversion: high-quality answer scored below low-quality answer' });
  }
}

function median(xs) { if (!xs.length) return 0; const ys = [...xs].sort((a,b) => a-b); const m = Math.floor(ys.length/2); return ys.length % 2 ? ys[m] : (ys[m-1] + ys[m])/2; }
const mean = values.reduce((a,b) => a+b, 0) / (values.length || 1);
const scoreStddev = Math.sqrt(values.reduce((a,b) => a + (b-mean)**2, 0) / (values.length || 1));
const d1 = score('q', 'same answer', 'same answer').score;
const d2 = score('q', 'same answer', 'same answer').score;
if (d1 !== d2) throw new Error('same-instance determinism failed');

const second = await WebAssembly.instantiate(module, {});
const e2 = second.exports;
function freshScore() {
  const q = enc.encode('q'), gt = enc.encode('same answer'), a = enc.encode('same answer');
  const pq = e2.alloc(q.length), pg = e2.alloc(gt.length), pa = e2.alloc(a.length);
  try { new Uint8Array(e2.memory.buffer, pq, q.length).set(q); new Uint8Array(e2.memory.buffer, pg, gt.length).set(gt); new Uint8Array(e2.memory.buffer, pa, a.length).set(a); return e2.rank_answer(pq,q.length,pg,gt.length,pa,a.length); }
  finally { e2.dealloc(pa,a.length); e2.dealloc(pg,gt.length); e2.dealloc(pq,q.length); }
}
const fresh = freshScore();
if (fresh !== d1) throw new Error(`fresh-instance determinism failed: ${fresh} != ${d1}`);

score('unicode', '正确答案 ✅ café 安全', '正确答案 ✅ café 安全');
const veryLong = 'valid '.repeat(12000);
score('long', veryLong, veryLong);
score('nul', 'answer', 'answer\0junk');

const out = { cases:data.cases.length, pairs, wins, losses, ties, inversions, meanMargin:pairs ? sum/pairs : 0, medianMargin:median(margins), worstMargin:Number.isFinite(worst)?worst:0, bestMargin:Number.isFinite(best)?best:0, selfMatch:exact.score, scoreStddev, deterministicRepeat:d1===d2, freshInstanceDeterministic:fresh===d1, invalidScoreCount:0, runtimeMs:performance.now()-startedAt, diagnosticFailures:failures };
console.log(JSON.stringify(out, null, 2));
if (inversions) process.exit(2);
