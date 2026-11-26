import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const address = '0x' + '1'.repeat(40);
const row = {prompt:'Review this test fixture for arithmetic errors.',chosen:'The fixture is only a structural test.',rejected:'No analysis was performed.',provenance:{source_kind:'human',source_url:'https://example.com/test-fixture'}};
function run(t, body) {
 const dir=mkdtempSync(join(tmpdir(),'veridex-eval-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const input=join(dir,'input.jsonl'), output=join(dir,'packet.json');
 writeFileSync(input,body);
 const result=spawnSync(process.execPath,['scripts/prepare-audit-evalpool-submission.mjs',input,address,output],{encoding:'utf8'});
 return {result,output};
}
test('preserves exact signed bytes including trailing newline',t=>{
 const body=JSON.stringify(row)+'\n';
 const {result,output}=run(t,body);
 assert.equal(result.status,0,result.stderr);
 const p=JSON.parse(readFileSync(output,'utf8'));
 assert.equal(Buffer.from(p.body_base64,'base64').toString(),body);
 assert.equal(p.body_sha256,createHash('sha256').update(body).digest('hex'));
 assert.equal(p.status,'UNSIGNED_NOT_UPLOADED');
 assert.equal(p.message.split('\n').length,5);
 assert.equal(p.message.endsWith('\n'),false);
 assert.ok(p.message.includes('chain_id: 11155111'));
});
test('rejects empty input',t=>assert.notEqual(run(t,'').result.status,0));
test('rejects duplicate normalized prompts',t=>assert.notEqual(run(t,JSON.stringify(row)+'\n'+JSON.stringify({...row,prompt:row.prompt+'  '})+'\n').result.status,0));
test('rejects mismatched intent',t=>assert.notEqual(run(t,JSON.stringify({...row,intent_id:'OTHER'})+'\n').result.status,0));
test('rejects identical answers',t=>assert.notEqual(run(t,JSON.stringify({...row,rejected:row.chosen})+'\n').result.status,0));

test('accepts judgment ground truth without a rejected answer', t => {
  const { rejected, ...answer } = row;
  const { result } = run(t, JSON.stringify({ ...answer, label_kind: 'ground_truth' }));
  assert.equal(result.status, 0, result.stderr);
});

test('rejects escaped control characters in answers', t => {
  assert.notEqual(run(t, JSON.stringify({ ...row, chosen: row.chosen + '\u0000' })).result.status, 0);
});

test('rejects generated and malformed provenance', t => {
  for (const provenance of [
    { ...row.provenance, source_kind: 'synthetic' },
    { ...row.provenance, source_url: 'https://' }
  ]) {
    assert.notEqual(run(t, JSON.stringify({ ...row, provenance })).result.status, 0);
  }
});
