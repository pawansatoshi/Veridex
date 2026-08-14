import { describe, expect, it, vi } from "vitest";
import { SourcifyVerificationProvider } from "../../src/infrastructure/sourcify.js";

const CONTRACT = "0x0000000000000000000000000000000000000001";

function response(status: number, payload: unknown, headers = new Headers()): Response {
  return new Response(JSON.stringify(payload), { status, headers });
}

describe("Sourcify verification provider", () => {
  it("normalizes a verified ABI lookup", async () => {
    const provider = new SourcifyVerificationProvider({
      chainId: "1",
      fetchImpl: vi.fn(async () => response(200, {
        match: "exact_match",
        abi: [{ type: "function", name: "pause", inputs: [], stateMutability: "nonpayable" }],
        compilation: { compilerVersion: "0.8.30" },
      })),
    });

    await expect(provider.lookup(CONTRACT)).resolves.toMatchObject({
      status: "verified",
      data: { abi: [{ type: "function", name: "pause" }] },
    });
  });

  it("distinguishes an unverified address", async () => {
    const provider = new SourcifyVerificationProvider({ chainId: "1", fetchImpl: vi.fn(async () => response(404, {})) });
    await expect(provider.lookup(CONTRACT)).resolves.toMatchObject({ status: "unverified_contract", httpStatus: 404 });
  });

  it("preserves rate-limit information", async () => {
    const headers = new Headers({ "retry-after": "2" });
    const provider = new SourcifyVerificationProvider({ chainId: "1", fetchImpl: vi.fn(async () => response(429, {}, headers)) });
    await expect(provider.lookup(CONTRACT)).resolves.toMatchObject({ status: "api_failure", httpStatus: 429, retryAfterMs: 2000 });
  });
});
