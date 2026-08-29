import fs from 'node:fs';
import assert from 'node:assert/strict';

const bytes = fs.readFileSync(new URL('./veridex-track2.wasm', import.meta.url));
const { instance } = await WebAssembly.instantiate(bytes, {});
const e = instance.exports;

for (const name of ['memory', 'alloc', 'dealloc', 'rank_answer']) assert.ok(e[name], `missing export: ${name}`);

function score(gt, answer) {
  const q = Buffer.from('What capabilities does this contract expose?');
  const g = Buffer.from(JSON.stringify(gt));
  const a = Buffer.from(typeof answer === 'string' ? answer : JSON.stringify(answer));
  const qp = e.alloc(q.length), gp = e.alloc(g.length), ap = e.alloc(a.length);
  assert.ok(qp && gp && ap, 'allocation failed');
  new Uint8Array(e.memory.buffer, qp, q.length).set(q);
  new Uint8Array(e.memory.buffer, gp, g.length).set(g);
  new Uint8Array(e.memory.buffer, ap, a.length).set(a);
  const out = e.rank_answer(qp, q.length, gp, g.length, ap, a.length);
  e.dealloc(qp, q.length); e.dealloc(gp, g.length); e.dealloc(ap, a.length);
  return out;
}

const gt = { ownership:true, upgradeability:true, pause:false, mint:false, evidence_refs:['rpc:1'], conclusive_state:'conclusive' };
assert.equal(score(gt, gt), 1);
assert.equal(score(gt, { ownership:true, upgradeability:false, pause:false, mint:false }), 0.7);
assert.ok(score(gt, { ownership:true, upgradeability:true, pause:false }) > 0.7 && score(gt, { ownership:true, upgradeability:true, pause:false }) < 0.8);
assert.equal(score(gt, '{"ownership":tru'), 0);
assert.equal(score(gt, '{"ownership":true,"ownership":false,"upgradeability":true,"pause":false,"mint":false}'), 0);
assert.equal(score({ ownership:'unknown', upgradeability:'unknown', pause:'unknown', mint:'unknown' }, { ownership:'unknown', upgradeability:'unknown', pause:'unknown', mint:'unknown' }), 0);
for (const candidate of [gt, {ownership:false,upgradeability:false,pause:false,mint:false}, {ownership:true,upgradeability:true,pause:false}, '{}']) {
  const s = score(gt, candidate); assert.ok(s >= 0 && s <= 1, `out of bounds: ${s}`);
}
console.log('Track 2 WASM structural/behavioral tests: PASS');
