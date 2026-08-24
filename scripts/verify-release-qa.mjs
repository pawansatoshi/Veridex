import { readFile } from "node:fs/promises";

const pages = [
  "index.html",
  "analyze/index.html",
  "passport/index.html",
  "evidence/index.html",
  "watch/index.html",
  "telegraph/index.html",
  "docs/index.html",
];

const required = [
  ["viewport", /<meta[^>]+name=[\"']viewport[\"']/i],
  ["overflow guard", /overflow-x\s*:\s*hidden/i],
  ["reduced motion", /prefers-reduced-motion/i],
];

const failures = [];
for (const page of pages) {
  const text = await readFile(page, "utf8");
  for (const [name, pattern] of required) {
    if (!pattern.test(text)) failures.push(`${page}: missing ${name}`);
  }
}

const evidence = await readFile("evidence/index.html", "utf8");
for (const [name, pattern] of [
  ["error role", /role=[\"']alert[\"']/i],
  ["expandable capability control", /aria-expanded=[\"']false[\"']/i],
  ["spatial interaction asset", /veridex-spatial\.(?:js|css)/i],
]) {
  if (!pattern.test(evidence)) failures.push(`evidence/index.html: missing ${name}`);
}

const analyze = await readFile("analyze/index.html", "utf8");
if (!/aria-label=[\"']Ethereum contract address[\"']/i.test(analyze)) failures.push("analyze/index.html: address input is not explicitly labelled");
if (!/role=[\"']alert[\"']/i.test(analyze)) failures.push("analyze/index.html: error state is not announced");

if (failures.length) {
  console.error("Phase 05E release QA FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 05E release QA static audit PASSED");
console.log(`Audited ${pages.length} release surfaces plus analyzer/evidence accessibility contracts.`);
console.log("This audit does not replace real-device visual, keyboard, or screen-reader testing.");
