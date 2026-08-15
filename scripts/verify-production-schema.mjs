#!/usr/bin/env node

const baseUrl = (process.env.VERIDEX_MINER_URL ?? "https://veridex-ecru.vercel.app").replace(/\/$/, "");
const address = process.env.VERIDEX_SCHEMA_TEST_ADDRESS ?? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error(`Invalid schema test address: ${address}`);

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Schema validation failed: ${message}`);
}

function assertCapability(value, expectedName) {
  assert(value && typeof value === "object", `${expectedName} capability is missing`);
  assert(typeof value.capability === "string", `${expectedName}.capability must be a string`);
  assert(["positive", "negative", "inconclusive", "unavailable", "error"].includes(value.result), `${expectedName}.result is invalid`);
  assert(value.evidence && typeof value.evidence === "object", `${expectedName}.evidence must be an object`);
  assert(["verified_abi", "verified_source", "bytecode_fallback", "direct_onchain"].includes(value.detectionMethod), `${expectedName}.detectionMethod is invalid`);
  assert(typeof value.confidence === "number" && value.confidence >= 0 && value.confidence <= 1, `${expectedName}.confidence must be in [0,1]`);
  assert(typeof value.conclusive === "boolean", `${expectedName}.conclusive must be boolean`);
}

const health = await getJson("/health");
assert(health.ok === true, "health.ok must be true");
assert(health.service === "veridex-miner", "health.service must identify the Miner");

const response = await fetch(`${baseUrl}/analyze`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ chain: "1", contractAddress: address }),
});
const body = await response.json();
assert(response.status === 200, `POST /analyze must return 200, got ${response.status}`);
assert(body && typeof body === "object", "response must be a JSON object");
assert(body.schema === "veridex.miner.v1", "schema must be veridex.miner.v1");

const result = body.result;
assert(result && typeof result === "object", "result must be an object");
assert(result.contract && typeof result.contract === "object", "result.contract must be an object");
assert(result.contract.requestedAddress === address, "result.contract.requestedAddress must echo the request");
assert(result.contract.contractAddress === address, "result.contract.contractAddress must echo the contract address");
assert(result.contract.chain === "1", "result.contract.chain must be canonicalized to 1");
assert(Array.isArray(result.capabilities), "result.capabilities must be an array");
const capabilityNames = result.capabilities.map((item) => item?.capability);
for (const name of ["ownership", "upgradeability", "pause", "mint"]) assert(capabilityNames.includes(name), `missing capability ${name}`);
assert(new Set(capabilityNames).size === capabilityNames.length, "capabilities must not contain duplicate names");
for (const capability of result.capabilities) assertCapability(capability, capability.capability);
assert(typeof result.confidence === "number" && result.confidence >= 0 && result.confidence <= 1, "result.confidence must be in [0,1]");
assert(typeof result.conclusive === "boolean", "result.conclusive must be boolean");
assert(result.providerStatus && typeof result.providerStatus === "object", "result.providerStatus must be an object");
assert(["ok", "unavailable", "error"].includes(result.providerStatus.rpc), "result.providerStatus.rpc is invalid");

const intelligence = body.capabilityIntelligence;
assert(intelligence && typeof intelligence === "object", "capabilityIntelligence must be present");
assert(intelligence.subject && typeof intelligence.subject === "object", "capabilityIntelligence.subject must be an object");
assert(intelligence.subject.contractAddress === address, "capabilityIntelligence.subject.contractAddress must match the request");
assert(Array.isArray(intelligence.capabilityMap), "capabilityIntelligence.capabilityMap must be an array");
assert(Array.isArray(intelligence.evidenceGraph), "capabilityIntelligence.evidenceGraph must be an array");
assert(["established", "partial", "inconclusive"].includes(intelligence.state), "capabilityIntelligence.state is invalid");
assert(typeof intelligence.confidence === "number" && intelligence.confidence >= 0 && intelligence.confidence <= 1, "capabilityIntelligence.confidence must be in [0,1]");

console.log(JSON.stringify({
  schema: body.schema,
  endpoint: `${baseUrl}/analyze`,
  request: { chain: "1", contractAddress: address },
  capabilities: capabilityNames,
  intelligenceState: intelligence.state,
  confidence: result.confidence,
  conclusive: result.conclusive,
  verifiedAt: new Date().toISOString(),
}, null, 2));
