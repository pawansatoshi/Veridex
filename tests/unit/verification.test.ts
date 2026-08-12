import { describe, expect, it, vi } from "vitest";
import { EtherscanVerificationClient } from "../../src/infra/verification.js";

const address = "0x1111111111111111111111111111111111111111";
const abi = JSON.stringify([{ type: "function", name: "owner", inputs: [], stateMutability: "view" }, { type: "function", name: "paused", inputs: [], stateMutability: "view" }]);

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("verification boundary", () => {
  it("parses a verified ABI and exact function inputs", async () => {
    const fetcher = vi.fn(async () => response({ status: "1", message: "OK", result: abi }));
    const client = new EtherscanVerificationClient("https://api.example", "secret", 1, fetcher);
    const result = await client.getContract(address);
    expect(result.status).toBe("verified");
    expect(result.abi?.some((entry) => entry.name === "owner" && entry.inputs.length === 0)).toBe(true);
  });

  it("distinguishes unverified from API failure", async () => {
    const unverified = vi.fn(async () => response({ status: "0", message: "NOTOK", result: "Contract source code not verified" }));
    const failed = vi.fn(async () => response({ status: "0", message: "NOTOK", result: "Max rate limit reached" }));
    const first = await new EtherscanVerificationClient("https://api.example", "secret", 1, unverified).getContract(address);
    const second = await new EtherscanVerificationClient("https://api.example", "secret", 1, failed).getContract(address);
    expect(first.status).toBe("unverified");
    expect(second.status).toBe("unavailable");
    expect(second.detail).toContain("Max rate");
  });

  it("reports missing configuration without making a network request", async () => {
    const fetcher = vi.fn();
    const result = await new EtherscanVerificationClient("https://api.example", undefined, 1, fetcher).getContract(address);
    expect(result).toEqual({ status: "unavailable", detail: "not_configured" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
