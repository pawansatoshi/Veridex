#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

const intent = 'SMART_CONTRACT_AUDIT_GENERAL';
const [file, address, output = 'evalpool-unsigned.json'] = process.argv.slice(2);
if (!file || !/^0x[0-9a-f]{40}$/i.test(address ?? '')) {
  throw new Error('Usage: node scripts/prepare-audit-evalpool-submission.mjs <reviewed-jsonl> <contributor-address> [output.json]');
}
const body = readFileSync(file);
if (!body.length || body.length > 32 * 1024 * 1024) throw new Error('Invalid body size');
const source = new TextDecoder('utf-8', {fatal:true}).decode(body);
const rows = source.split(/\r?\n/).filter(line => line.trim());
if (!rows.length) throw new Error('No evaluation rows');
const seen = new Set();
const norm = s => s.normalize('NFC').replace(/\s+/gu,' ').trim();
for (const [i,line] of rows.entries()) {
  if (Buffer.byteLength(line) > 65536 || line.includes('\0')) throw new Error('Invalid row size or control character: '+(i+1));
  const row = JSON.parse(line);
  if ((row.label_kind ?? 'preference_pair') !== 'preference_pair' || (row.intent_id && row.intent_id !== intent)) throw new Error('Unsupported row kind/intent: '+(i+1));
  for (const [key,min,max] of [['prompt',16,16000],['chosen',8,32000],['rejected',8,32000]]) {
    if (typeof row[key] !== 'string' || [...norm(row[key])].length < min || [...norm(row[key])].length > max) throw new Error('Invalid '+key+' at row '+(i+1));
  }
  if (norm(row.chosen) === norm(row.rejected) || seen.has(norm(row.prompt))) throw new Error('Duplicate prompt or answer at row '+(i+1));
  seen.add(norm(row.prompt));
  if (!row.provenance || !/^https?:\/\//i.test(row.provenance.source_url ?? '')) throw new Error('Source URL required: '+(i+1));
}
const nonce = randomBytes(16).toString('hex');
const hash = createHash('sha256').update(body).digest('hex');
const message = ['Telegraph eval-pool submission v1','intent_id: '+intent,'body_sha256: '+hash,'nonce: '+nonce,'chain_id: 11155111'].join('\n');
const packet = {intent_id:intent,submitter:address,chain_id:11155111,rows:rows.length,body_sha256:hash,body_base64:body.toString('base64'),nonce,message,url:'https://devnode.telegraphprotocol.com/api/evalpool/submissions?intent_id='+intent+'&submitter='+address,headers:{'Content-Type':'application/x-ndjson','X-Evalpool-Nonce':nonce},status:'UNSIGNED_NOT_UPLOADED',warning:'Structural validation only. Independent evidence review and contributor signature remain required. Never store private keys.'};
writeFileSync(output,JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
console.log('Prepared unsigned packet:',output,'rows:',rows.length);
