import { detectAddress, isEvmAddress } from "../src/domain/address.js";
import { loadRuntimeConfig } from "../src/infrastructure/config.js";
import { JsonRpcClient } from "../src/infrastructure/rpc.js";

const rpc = new JsonRpcClient(loadRuntimeConfig(process.env));

export default async function handler(req: { method?: string; body?: unknown }, res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void }): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }
  const input = req.body as Record<string, unknown> | undefined;
  if (!input || typeof input.address !== "string" || input.address.trim().length < 2 || input.address.length > 256) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "invalid_request", detail: "Expected an address" }));
    return;
  }

  const address = input.address.trim();
  const detection = detectAddress(address);

  if (isEvmAddress(address)) {
    const code = await rpc.call<string>("eth_getCode", [address, "latest"]);
    if (code.kind === "success") {
      const isContract = typeof code.value === "string" && code.value !== "0x" && code.value !== "0x0";
      res.statusCode = 200;
      res.end(JSON.stringify({
        ...detection,
        kind: isContract ? "evm_contract" : "evm_wallet",
        label: isContract ? "Ethereum / EVM smart contract" : "Ethereum / EVM wallet (EOA)",
        confidence: "high",
        supportedForAnalysis: isContract,
        reason: isContract ? "EVM address has deployed runtime bytecode" : "EVM address has no deployed contract bytecode",
      }));
      return;
    }
  }

  res.statusCode = 200;
  res.end(JSON.stringify(detection));
}
