const fs = require('fs');

const wasmPath = process.argv[2];
const casesPath = process.argv[3] || 'telegraph/evaluation/track2-benchmark-v2.json';

if (!wasmPath) {
  throw new Error('usage: node track2-preflight.js candidate.wasm [benchmark.json]');
}

const bytes = fs.readFileSync(wasmPath);
const data = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

async function instantiate() {
  return WebAssembly.instantiate(bytes, {});
}

function requiredExports(exports) {
  for (const name of ['memory', 'alloc', 'dealloc', 'rank_answer', 'breakdown_answer']) {
    if (!(name in exports)) throw new Error(`missing export ${name}`);
  }
}

function makeScorer(instance) {
  const e = instance.exports;
  requiredExports(e);
  const enc = new TextEncoder();

  return function score(q, gt, answer, withBreakdown = false) {
    const parts = [enc.encode(q), enc.encode(gt), enc.encode(answer)];
    const ptrs = parts.map((b) => (b.length ? e.alloc(b.length) : 0));
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length) {
        if (!ptrs[i]) throw new Error(`alloc returned null for input ${i}`);
        const mem = new Uint8Array(e.memory.buffer);
        if (ptrs[i] + parts[i].length > mem.length) throw new Error('allocated input exceeds memory');
        mem.set(parts[i], ptrs[i]);
      }
    }

    const r = e.rank_answer(
      ptrs[0], parts[0].length,
      ptrs[1], parts[1].length,
      ptrs[2], parts[2].length,
    );

    let breakdown = null;
    if (withBreakdown) {
      const bp = e.breakdown_answer(
        ptrs[0], parts[0].length,
        ptrs[1], parts[1].length,
        ptrs[2], parts[2].length,
      );
      if (!bp) throw new Error('breakdown_answer returned null pointer');
      const view = new DataView(e.memory.buffer, bp, 5 * 4);
      breakdown = Array.from({ length: 5 }, (_, i) => view.getFloat32(i * 4, true));
      if (breakdown.some((x) => !Number.isFinite(x) || x < 0 || x > 1)) {
        throw new Error(`invalid breakdown ${JSON.stringify(breakdown)}`);
      }
    }

    for (let i = 2; i >= 0; i--) {
      if (parts[i].length) e.dealloc(ptrs[i], parts[i].length);
    }

    if (!Number.isFinite(r) || r < 0 || r > 1) throw new Error(`invalid score ${r}`);
    return { score: r, breakdown };
  };
}

(async () => {
  const { instance } = await instantiate();
  const e = instance.exports;
  requiredExports(e);

  const imports = WebAssembly.Module.imports(instance.module || await WebAssembly.compile(bytes));
  if (imports.length) throw new Error(`imports present: ${JSON.stringify(imports)}`);

  const score = makeScorer(instance);

  // Stage-1 hard zeros.
  const hard = [
    ['empty answer', score('q', 'answer', '').score, 0],
    ['whitespace', score('q', 'answer', ' \t\n\r\f\v').score, 0],
    ['empty ground truth', score('q', '', 'answer').score, 0],
  ];
  for (const [name, actual, expected] of hard) {
    if (actual !== expected) throw new Error(`${name}: ${actual} != ${expected}`);
  }

  const exact = score('q', 'Apple is legitimate.', 'Apple is legitimate.', true);
  if (exact.score !== 1) throw new Error(`exact match != 1 (${exact.score})`);
  if (!exact.breakdown) throw new Error('breakdown missing for non-empty input');

  let pairs = 0;
  let inversions = 0;
  let sum = 0;
  let worst = Infinity;
  let values = [];
  let self = Infinity;

  for (const c of data.cases) {
    const high = c.answers.filter((x) => x.tier === 'high');
    const low = c.answers.filter((x) => x.tier === 'low');
    const selfScore = score(c.question, c.ground_truth, c.ground_truth).score;
    self = Math.min(self, selfScore);

    for (const h of high) {
      for (const l of low) {
        const sh = score(c.question, c.ground_truth, h.text).score;
        const sl = score(c.question, c.ground_truth, l.text).score;
        const margin = sh - sl;
        pairs += 1;
        sum += margin;
        worst = Math.min(worst, margin);
        values.push(sh, sl);
        if (!(margin > 0)) {
          inversions += 1;
          console.error(JSON.stringify({
            case: c.id,
            question: c.question,
            groundTruth: c.ground_truth,
            high: h.label,
            highScore: sh,
            low: l.label,
            lowScore: sl,
            margin,
            diagnosis: 'high answer did not outrank low answer',
          }));
        }
      }
    }
  }

  // Stress cases: long UTF-8 and embedded NUL.
  score('long', 'valid '.repeat(16000), 'valid '.repeat(15000));
  score('unicode', '正确答案 ✅ café 安全', '正确答案 ✅ café 安全');
  score('nul', 'answer', 'answer\0junk');

  // Fresh-instance determinism: the same inputs must agree across instances.
  const first = score('q', 'same answer', 'same answer').score;
  const second = score('q', 'same answer', 'same answer').score;
  if (first !== second) throw new Error('same-instance determinism failed');
  const secondInstance = await instantiate();
  const fresh = makeScorer(secondInstance.instance).call
    ? makeScorer(secondInstance.instance)
    : null;
  const freshScore = fresh('q', 'same answer', 'same answer').score;
  if (first !== freshScore) throw new Error(`fresh-instance determinism failed: ${first} != ${freshScore}`);

  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length || 1));

  const out = {
    wasmBytes: bytes.length,
    imports: imports.length,
    cases: data.cases.length,
    pairs,
    inversions,
    meanMargin: pairs ? sum / pairs : 0,
    worstMargin: Number.isFinite(worst) ? worst : 0,
    selfMatch: self,
    scoreStddev: sd,
  };

  console.log(JSON.stringify(out, null, 2));
  if (inversions) process.exit(2);
})().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
