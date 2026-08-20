import { JsonRpcClient } from "../src/infrastructure/rpc.js";

export default async function handler(
  req: { method?: string },
  res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void },
): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");

  if (process.env.VERCEL_ENV === "production") {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  let providerCalls = 0;
  const fakeFetch: typeof fetch = async () => {
    providerCalls += 1;
    if (providerCalls <= 3) throw new DOMException("simulated RPC timeout", "AbortError");
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: providerCalls, result: "0x" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const rpc = new JsonRpcClient(
    {
      rpcUrl: "https://phase01-resilience.invalid",
      rpcTimeoutMs: 100,
      rpcMaxRetries: 0,
      rpcRetryBaseMs: 10,
      circuitFailureThreshold: 3,
      circuitResetTimeoutMs: 1_000,
    },
    fakeFetch,
  );

  const failures: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const result = await rpc.call("eth_chainId");
    if (result.kind !== "failure" || result.failure.class !== "timeout") {
      res.statusCode = 500;
      res.end(JSON.stringify({ valid: false, error: `expected timeout failure at attempt ${index + 1}` }));
      return;
    }
    failures.push(result.failure.class);
  }

  const opened = await rpc.call("eth_chainId");
  if (opened.kind !== "failure" || opened.failure.class !== "circuit_open") {
    res.statusCode = 500;
    res.end(JSON.stringify({ valid: false, error: "expected circuit breaker to open after repeated provider timeouts" }));
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1_050));
  const recovered = await rpc.call<string>("eth_chainId");
  if (recovered.kind !== "success" || recovered.value !== "0x") {
    res.statusCode = 500;
    res.end(JSON.stringify({ valid: false, error: "expected provider recovery after circuit reset" }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    schema: "veridex.phase01.resilience-self-test.v1",
    valid: true,
    injectedFailure: "rpc_timeout",
    timeoutFailures: failures.length,
    circuitOpened: true,
    recovery: true,
    providerCalls,
  }));
}
