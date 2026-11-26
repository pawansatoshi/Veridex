#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

import { TARGET_INTENT as intent, validateRows } from './validate-smart-contract-audit-data.mjs';
const [file, address, output = 'evalpool-unsigned.json'] = process.argv.slice(2);
if (!file || !/^0x[0-9a-f]{40}$/i.test(address ?? '')) {
  throw new Error('Usage: node scripts/prepare-audit-evalpool-submission.mjs <reviewed-jsonl> <contributor-address> [output.json]');
}
const body = readFileSync(file);
if (!body.length || body.length > 32 * 1024 * 1024) throw new Error('Invalid body size');
const source = new TextDecoder('utf-8', {fatal:true}).decode(body);
const rows = source.split(/\r?\n/).filter(line => line.trim());
if (!rows.length) throw new Error('No evaluation rows');
const parsedRows = rows.map((line, index) => {
  const number = index + 1;
  if (Buffer.byteLength(line) > 65536 || line.includes('\0')) {
    throw new Error('Invalid row size or control character: ' + number);
  }
  try {
    return JSON.parse(line);
  } catch {
    throw new Error('Invalid JSON at row ' + number);
  }
});
const validation = validateRows(parsedRows, { trainingQuality: false });
if (!validation.ok) throw new Error(validation.failures.join('\n'));
if (validation.material.truthSources) throw new Error('Truth sources require a confirmed Hybrid route');
if (validation.provenance.selfDeclaredHumanWithUrl !== rows.length) {
  throw new Error('Every row requires declared human provenance and a valid HTTP(S) source URL');
}
const nonce = randomBytes(16).toString('hex');
const hash = createHash('sha256').update(body).digest('hex');
const message = ['Telegraph eval-pool submission v1','intent_id: '+intent,'body_sha256: '+hash,'nonce: '+nonce,'chain_id: 11155111'].join('\n');
const packet = {intent_id:intent,submitter:address,chain_id:11155111,rows:rows.length,body_sha256:hash,body_base64:body.toString('base64'),nonce,message,url:'https://devnode.telegraphprotocol.com/api/evalpool/submissions?intent_id='+intent+'&submitter='+address,headers:{'Content-Type':'application/x-ndjson','X-Evalpool-Nonce':nonce},status:'UNSIGNED_NOT_UPLOADED',warning:'Structural validation only. Independent evidence review and contributor signature remain required. Never store private keys.'};
writeFileSync(output,JSON.stringify(packet,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Prepared unsigned packet:',output,'rows:',rows.length);
