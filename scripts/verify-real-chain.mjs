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

const CAPABILITIES = ["ownership", "upgradeability", "pause", "mint"];

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
    body: JSON.stringify({ chain: "1", contractAddress: address }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Miner returned ${response.status}: ${JSON.stringify(body)}`);
  if (!body.result || !Array.isArray(body.result.capabilities)) {
    throw new Error(`Miner returned an invalid result envelope: ${JSON.stringify(body)}`);
  }
  return body.result;
}

function evaluateCase(expected, actual) {
  const mismatches = [];
  const observations = {};

  for (const capability of CAPABILITIES) {
    const expectedResult = expected[capability];
    if (expectedResult === undefined) continue;
    const observation = actual.capabilities.find((item) => item.capability === capability);
    if (!observation) {
      mismatches.push(`${capability}: missing`);
      observations[capability] = { expected: expectedResult, actual: "missing", classification: "error" };
      continue;
    }

    const actualResult = observation.result;
    const classification = actualResult === "inconclusive"
      ? "inconclusive"
      : actualResult === "unavailable"
        ? "unavailable"
        : actualResult === "error"
          ? "error"
          : actualResult === expectedResult
            ? expectedResult === "positive" ? "true_positive" : "true_negative"
            : expectedResult === "positive" ? "false_negative" : "false_positive";

    observations[capability] = { expected: expectedResult, actual: actualResult, classification };
    if (classification === "false_positive" || classification === "false_negative") {
      mismatches.push(`${capability}: expected ${expectedResult}, got ${actualResult}`);
    }
    if (classification === "error" || classification === "unavailable") {
      mismatches.push(`${capability}: ${actualResult}`);
    }
  }

  return { observations, mismatches };
}

const blockNumber = await rpc("eth_blockNumber");
const observedAt = new Date().toISOString();
const cases = [];

for (const testCase of corpus) {
  const code = await rpc("eth_getCode", [testCase.address, "latest"]);
  const result = await analyze(testCase.address);
  const evaluation = evaluateCase(testCase.expected, result);
  const codePresent = code !== "0x" && code !== "0x0";
  const passed = codePresent && evaluation.mismatches.length === 0;

  cases.push({
    ...testCase,
    observed: {
      codePresent,
      codeAddress: result.contract?.codeAddress ?? result.contract?.contractAddress,
      verificationStatus: result.verification?.status,
      providerStatus: result.providerStatus,
      capabilities: result.capabilities,
      confidence: result.confidence,
      conclusive: result.conclusive,
    },
    evaluation,
    passed,
  });
}

const confusion = Object.fromEntries(CAPABILITIES.map((capability) => [capability, {
  truePositive: 0,
  trueNegative: 0,
  falsePositive: 0,
  falseNegative: 0,
  inconclusive: 0,
  unavailable: 0,
  error: 0,
  total: 0,
}]));

for (const testCase of cases) {
  for (const [capability, observation] of Object.entries(testCase.evaluation.observations)) {
    confusion[capability][observation.classification] += 1;
    confusion[capability].total += 1;
  }
}

const totals = Object.values(confusion).reduce((sum, metric) => {
  for (const key of Object.keys(sum)) sum[key] += metric[key];
  return sum;
}, { truePositive: 0, trueNegative: 0, falsePositive: 0, falseNegative: 0, inconclusive: 0, unavailable: 0, error: 0, total: 0 });

const evaluated = totals.truePositive + totals.trueNegative + totals.falsePositive + totals.falseNegative;
const report = {
  schema: "veridex.real-chain-ground-truth.v2",
  endpoint,
  rpcUrl,
  network: "ethereum",
  observedAt,
  blockNumber,
  corpus: corpus.map(({ id, name, address, expected, sources }) => ({ id, name, address, expected, sources })),
  caseCount: cases.length,
  passed: cases.filter((item) => item.passed).length,
  failed: cases.filter((item) => !item.passed).length,
  metrics: {
    ...totals,
    evaluated,
    accuracy: evaluated === 0 ? 0 : (totals.truePositive + totals.trueNegative) / evaluated,
  },
  confusionByCapability: confusion,
  cases,
};

const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir(outputPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0 || totals.falsePositive > 0 || totals.falseNegative > 0 || totals.error > 0 || totals.unavailable > 0) process.exit(1);
