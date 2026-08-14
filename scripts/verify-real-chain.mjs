#!/usr/bin/env node

const endpoint = (process.env.VERIDEX_MINER_URL ?? "https://veridex-ecru.vercel.app").replace(/\/$/, "");
const rpcUrl = process.env.VERIDEX_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const outputPath = process.env.VERIDEX_GROUND_TRUTH_OUTPUT ?? "artifacts/real-chain-ground-truth.json";

const corpus = [
  {
    id: "ethereum-usdc-proxy",
    name: "Circle USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    expected: { ownership: "positive", upgradeability: "positive", pause: "positive", mint: "positive" },
    sources: [
      "https://developers.circle.com/stablecoins/usdc-contract-addresses",
      "https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    ],
  },
  {
    id: "ethereum-weth9-direct",
    name: "WETH9",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    expected: { ownership: "negative", upgradeability: "negative", pause: "negative", mint: "negative" },
    sources: [
      "https://ercs.ethereum.org/ERCS/erc-7528",
      "https://ethereum.org/developers/tutorials/ai-trading-agent/",
    ],
  },
  {
    id: "ethereum-uniswap-v3-router-direct",
    name: "Uniswap V3 SwapRouter",
    address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    expected: { ownership: "negative", upgradeability: "negative", pause: "negative", mint: "negative" },
    sources: [
      "https://etherscan.io/address/0xe592427a0aece92de3edee1f18e0157c05861564",
    ],
  },
];

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`RPC ${body.error.code}: ${body.error.message}`);
  return body.result;
}

async function analyze(address) {
  const response = await fetch(`${endpoint}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ chain: "ethereum", contractAddress: address }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Miner returned ${response.status}: ${JSON.stringify(body)}`);
  return body.result;
}

function checkCapabilities(expected, actual) {
  const mismatches = [];
  for (const [capability, expectedResult] of Object.entries(expected)) {
    const observation = actual.capabilities?.find((item) => item.capability === capability);
    if (!observation) {
      mismatches.push(`${capability}: missing`);
      continue;
    }
    if (observation.result !== expectedResult) {
      mismatches.push(`${capability}: expected ${expectedResult}, got ${observation.result}`);
    }
  }
  return mismatches;
}

const blockNumber = await rpc("eth_blockNumber");
const observedAt = new Date().toISOString();
const cases = [];
let failures = 0;

for (const testCase of corpus) {
  const code = await rpc("eth_getCode", [testCase.address, "latest"]);
  const result = await analyze(testCase.address);
  const mismatches = checkCapabilities(testCase.expected, result);
  const passed = code !== "0x" && code !== "0x0" && mismatches.length === 0;
  if (!passed) failures += 1;
  cases.push({
    ...testCase,
    observed: {
      codePresent: code !== "0x" && code !== "0x0",
      codeAddress: result.contract?.codeAddress ?? result.contract?.contractAddress,
      verificationStatus: result.verification?.status,
      providerStatus: result.providerStatus,
      capabilities: result.capabilities,
      confidence: result.confidence,
      conclusive: result.conclusive,
    },
    mismatches,
    passed,
  });
}

const report = {
  schema: "veridex.real-chain-ground-truth.v1",
  endpoint,
  rpcUrl,
  network: "ethereum",
  observedAt,
  blockNumber,
  caseCount: cases.length,
  passed: cases.filter((item) => item.passed).length,
  failed: failures,
  cases,
};

const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir(outputPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (failures > 0) process.exit(1);
