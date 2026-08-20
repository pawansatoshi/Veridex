#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const yamlPath = new URL("../telegraph/miner.yaml", import.meta.url);
const docsUrl = process.env.TELEGRAPH_YAML_STANDARD_URL ?? "https://raw.githubusercontent.com/telegraphprotocol/telegraph-docs/main/miners/yaml-config.md";

const yaml = await readFile(yamlPath, "utf8");

if (/^\s+intents:\s*$/m.test(yaml)) {
  throw new Error("telegraph/miner.yaml uses endpoint-level intents; current Telegraph standard requires semantics.supported_intents");
}

const supportedMatch = yaml.match(/semantics:\s*\n(?:.|\n)*?supported_intents:\s*\n((?:\s+-\s+[^\n]+\n?)+)/m);
if (!supportedMatch) throw new Error("Missing semantics.supported_intents in telegraph/miner.yaml");

const configured = [...supportedMatch[1].matchAll(/^\s+-\s+([A-Z0-9_]+)\s*$/gm)].map((match) => match[1]);
if (configured.length === 0) throw new Error("semantics.supported_intents must contain at least one Intent");

const response = await fetch(docsUrl, { headers: { accept: "text/plain" } });
if (!response.ok) throw new Error(`Unable to fetch Telegraph YAML standard: HTTP ${response.status}`);
const docs = await response.text();

const canonicalHeading = docs.indexOf("Canonical Intents (declare at least one):");
if (canonicalHeading < 0) throw new Error("Telegraph YAML standard did not expose its Canonical Intents section");
const canonicalSection = docs.slice(canonicalHeading, canonicalHeading + 2_000);
const canonical = new Set((canonicalSection.match(/[A-Z][A-Z0-9_]{2,}/g) ?? []).filter((value) => value !== "CANONICAL"));

const invalid = configured.filter((intent) => !canonical.has(intent));
if (invalid.length > 0) {
  throw new Error(`Unsupported Telegraph Intent(s): ${invalid.join(", ")}`);
}

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  standard: docsUrl,
  configuredIntents: configured,
  canonicalIntents: [...canonical],
  valid: true,
}, null, 2));
