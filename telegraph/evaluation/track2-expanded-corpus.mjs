#!/usr/bin/env node
import fs from 'node:fs';

const input = process.argv[2] || 'telegraph/evaluation/track2-benchmark-v2.json';
const output = process.argv[3] || 'telegraph/evaluation/track2-expanded-benchmark.json';

const src = JSON.parse(fs.readFileSync(input, 'utf8'));
const cases = [];
const seen = new Set();
const pushCase = (question, ground_truth, high, low, label) => {
  const key = JSON.stringify([question, ground_truth, high, low, label]);
  if (seen.has(key)) return;
  seen.add(key);
  cases.push({question, ground_truth, answers:[{label:`${label}-high`,text:high,tier:'high'},{label:`${label}-low`,text:low,tier:'low'}]});
};

const phrase = (s) => {
  const reps = [
    [/\bbullish\b/gi,'positive'],[/\bbearish\b/gi,'negative'],[/\bfraudulent\b/gi,'fraud'],[/\blegitimate\b/gi,'genuine'],
    [/\bmalicious\b/gi,'harmful'],[/\bdangerous\b/gi,'unsafe'],[/\bauthorized\b/gi,'approved'],[/\bunauthorized\b/gi,'not authorized'],
    [/\bincreased\b/gi,'rose'],[/\bdecreased\b/gi,'fell'],[/\breduced\b/gi,'dropped'],[/\bconfirmed\b/gi,'verified']
  ];
  let out=s; for (const [r,v] of reps) out=out.replace(r,v); return out;
};

const punctuation = (s) => s.replace(/[.!?]+$/,'') + '.';
const whitespace = (s) => s.replace(/\s+/g,' ').trim();
const prefix = (s) => `Answer: ${s}`;
const neutral = (s) => `According to the provided information, ${s}`;
const tail = (s) => `${s} Unrelated background information is not part of the answer.`;
const entitySwap = (s) => s.replace(/\bApple\b/,'Microsoft').replace(/\bCoinbase\b/,'Binance').replace(/\bEthereum\b/,'Solana').replace(/\bKraken\b/,'Coinbase');
const numberSwap = (s) => s.replace(/\$?1\.25\s*billion/gi,'$1.75 billion').replace(/\$?3\.42\s*billion/gi,'$4.42 billion').replace(/\$?4\.2\s*million/gi,'$5.2 million').replace(/\$?2\.5\s*million/gi,'$3.5 million').replace(/\b30%\b/g,'40%').replace(/\b15%\b/g,'25%').replace(/\b20%\b/g,'30%').replace(/\b12%\b/g,'22%').replace(/\b42\b/g,'84').replace(/\b60\b/g,'70');
const directionSwap = (s) => s.replace(/\b(increased|increase|rose|rise|rising|up|higher)\b/gi,'DECREASE_MARK').replace(/\b(decreased|decrease|fell|fall|falling|down|lower|declined|reduced|dropped)\b/gi,'INCREASE_MARK').replace(/DECREASE_MARK/g,'decreased').replace(/INCREASE_MARK/g,'increased');
const polarityFlip = (s) => s.replace(/\b(safe|secure|benign|legitimate|genuine|trusted|authorized|approved|allowed|permitted|confirmed|bullish|positive)\b/gi,'unsafe').replace(/\b(unsafe|malicious|fraudulent|fraud|scam|dangerous|harmful|rejected|denied|blocked|forbidden|compromised|bearish|negative)\b/gi,'safe');

for (const c of src.cases) {
  const highs = c.answers.filter(a => a.tier === 'high');
  const lows = c.answers.filter(a => a.tier === 'low');
  if (!highs.length || !lows.length) continue;
  const h = highs[0].text; const l = lows[0].text;
  pushCase(c.question,c.ground_truth,h,l,'base');
  pushCase(c.question,c.ground_truth,punctuation(h),punctuation(l),'punctuation');
  pushCase(c.question,c.ground_truth,whitespace(h),whitespace(l),'whitespace');
  pushCase(c.question,c.ground_truth,prefix(h),prefix(l),'prefix');
  pushCase(c.question,c.ground_truth,neutral(h),neutral(l),'neutral');
  pushCase(c.question,c.ground_truth,phrase(h),phrase(l),'paraphrase');
  pushCase(c.question,c.ground_truth,h,tail(h),'distractor');
  if (/\d/.test(h+c.ground_truth)) pushCase(c.question,c.ground_truth,h,numberSwap(h),'numeric');
  if (/\b(Apple|Coinbase|Ethereum|Kraken)\b/.test(h)) pushCase(c.question,c.ground_truth,h,entitySwap(h),'entity');
  if (/\b(increased|increase|rose|rise|decreased|decrease|fell|fall|declined|reduced|dropped)\b/i.test(h)) pushCase(c.question,c.ground_truth,h,directionSwap(h),'direction');
  if (/\b(safe|secure|benign|legitimate|genuine|trusted|authorized|approved|allowed|permitted|confirmed|bullish|positive|unsafe|malicious|fraudulent|fraud|scam|dangerous|harmful|rejected|denied|blocked|forbidden|compromised|bearish|negative)\b/i.test(h)) pushCase(c.question,c.ground_truth,h,polarityFlip(h),'polarity');
}

const expanded = {intent:src.intent,cases};
fs.writeFileSync(output, JSON.stringify(expanded, null, 2));
console.log(JSON.stringify({input,output,cases:cases.length},null,2));
