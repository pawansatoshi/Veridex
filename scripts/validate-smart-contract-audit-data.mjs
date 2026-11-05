#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const normalize = (s) => s.normalize("NFC").replace(/\s+/gu, " ").trim();

export function validateRows(inputRows) {
  const failures = [], warnings = [], rows = [], seenPrompts = new Map();
  let generated = 0, humanWithUrl = 0, missingProvenance = 0, skipped = 0;
  for (let i = 0; i < inputRows.length; i++) {
    const line = i + 1, row = inputRows[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) { failures.push("line " + line + ": row must be an object"); continue; }
    if (row.label_kind && row.label_kind !== "preference_pair") { skipped++; continue; }
    if (![row.prompt,row.chosen,row.rejected].every(v => typeof v === "string" && v.trim())) { failures.push("line " + line + ": preference pair requires non-empty prompt, chosen and rejected"); continue; }
    if (row.intent_id && row.intent_id !== "SMART_CONTRACT_AUDIT_GENERAL") failures.push("line " + line + ": wrong intent_id");
    if (Buffer.byteLength(JSON.stringify(row), "utf8") > 64*1024) failures.push("line " + line + ": row exceeds 64 KiB");
    for (const [key,min,max] of [["prompt",16,16000],["chosen",8,32000],["rejected",8,32000]]) {
      const value = normalize(row[key]);
      if (value.length < min || value.length > max) failures.push("line " + line + ": " + key + " length outside " + min + ".." + max);
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(row[key])) failures.push("line " + line + ": " + key + " contains control characters");
    }
    if (normalize(row.chosen) === normalize(row.rejected)) failures.push("line " + line + ": chosen and rejected are identical");
    const prompt = normalize(row.prompt);
    if (seenPrompts.has(prompt)) failures.push("line " + line + ": duplicate normalized prompt (first line " + seenPrompts.get(prompt) + ")");
    else seenPrompts.set(prompt,line);
    const kind = String(row.provenance?.source_kind ?? "").toLowerCase();
    const url = String(row.provenance?.source_url ?? "");
    if (["llm","synthetic","generated","model"].includes(kind)) generated++;
    else if (kind === "human" && /^https?:\/\//i.test(url)) humanWithUrl++;
    if (!kind || !url) missingProvenance++;
    rows.push({chosen:row.chosen,rejected:row.rejected});
  }
  const n=rows.length, counts=new Map();
  for (const row of rows) counts.set(row.rejected.trim(),(counts.get(row.rejected.trim())??0)+1);
  const uniqueRate=n?counts.size/n:0, maxRepeated=n?Math.max(...counts.values())/n:1;
  const identical=n?rows.filter(r=>r.chosen.trim()===r.rejected.trim()).length/n:1;
  const longer=rows.filter(r=>r.chosen.length>r.rejected.length).length;
  const ties=rows.filter(r=>r.chosen.length===r.rejected.length).length;
  const longerAccuracy=n?(longer+ties*0.5)/n:0.5;
  const lengthShortcut=Math.max(longerAccuracy,1-longerAccuracy);
  if (!n) failures.push("no usable preference pairs");
  if (n&&uniqueRate<0.80) failures.push("unique rejected answers "+(uniqueRate*100).toFixed(1)+"% < 80%");
  if (maxRepeated>0.02) failures.push("most-repeated rejected answer share "+(maxRepeated*100).toFixed(1)+"% > 2%");
  if (identical>0.01) failures.push("identical answer rate "+(identical*100).toFixed(1)+"% > 1%");
  if (lengthShortcut>0.65) failures.push("length-only shortcut "+(lengthShortcut*100).toFixed(1)+"% > 65%");
  if (generated) warnings.push(generated+" generated/model rows are unverified; never relabel them as human");
  if (missingProvenance) warnings.push(missingProvenance+" rows lack source_kind or source_url");
  if (humanWithUrl<n) warnings.push(humanWithUrl+"/"+n+" rows have human provenance plus an HTTP(S) source URL; a URL alone is not attestation");
  warnings.push("Run the pinned Telegraph kit's train_adapter.py --check-data; it additionally checks held-out negative leakage and a five-seed bag-of-words surface-style probe.");
  const ok=failures.length===0;
  return {ok,usablePairs:n,skippedRows:skipped,metrics:{uniqueRejectedFraction:Number(uniqueRate.toFixed(4)),maxRejectedShare:Number(maxRepeated.toFixed(4)),identicalAnswerFraction:Number(identical.toFixed(4)),lengthShortcutAccuracy:Number(lengthShortcut.toFixed(4))},provenance:{humanWithUrl,generatedUnverified:generated,missing:missingProvenance},failures,warnings,readyForLocalPreflight:ok,readyForPoolSubmission:ok&&generated===0&&missingProvenance===0&&humanWithUrl===n};
}
function main() {
  const args=process.argv.slice(2), at=args.indexOf("--input");
  if(at<0||!args[at+1]){console.error("Usage: node scripts/validate-smart-contract-audit-data.mjs --input <pairs.jsonl>");process.exit(2);}
  const file=args[at+1], rows=[], parseFailures=[];
  const lines=fs.readFileSync(file,"utf8").split(/\r?\n/u).filter(line=>line.trim());
  for(let i=0;i<lines.length;i++){try{rows.push(JSON.parse(lines[i]));}catch{parseFailures.push("line "+(i+1)+": invalid JSON");}}
  const result=validateRows(rows);
  result.failures.unshift(...parseFailures);
  result.ok=result.failures.length===0;
  result.readyForLocalPreflight=result.ok;
  result.readyForPoolSubmission=result.ok&&result.provenance.generatedUnverified===0&&result.provenance.missing===0&&result.provenance.humanWithUrl===result.usablePairs;
  console.log(JSON.stringify({file,...result},null,2));
  process.exit(result.ok?0:1);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) main();
