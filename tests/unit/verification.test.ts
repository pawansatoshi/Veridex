import { describe, expect, it } from "vitest";
import {
  NotConfiguredVerificationProvider,
  VerificationClient,
  normalizeVerificationEvidence,
  type VerificationProvider,
} from "../../src/infrastructure/verification.js";

describe("verification evidence", () => {
  it("keeps not-configured distinct from an unverified contract", async () => {
    const client = new VerificationClient(new NotConfiguredVerificationProvider(), 100);
    const result = await client.lookup("0x0000000000000000000000000000000000000001");

    expect(result).toMatchObject({
      status: "not_configured",
      verified: false,
      provenance: "none",
    });

    expect(normalizeVerificationEvidence("0x0000000000000000000000000000000000000001", {
      status: "unverified_contract",
      detail: "Provider has no verified source for this address",
    })).toMatchObject({
      status: "unverified_contract",
      verified: false,
      provenance: "none",
    });
  });

  it("preserves verified ABI/source provenance", () => {
    const abi = normalizeVerificationEvidence("0x0000000000000000000000000000000000000001", {
      status: "verified",
      data: { abi: [{ type: "function", name: "owner" }] },
    });
    const source = normalizeVerificationEvidence("0x0000000000000000000000000000000000000001", {
      status: "verified",
      data: { sourceCode: "contract Example {}" },
    });

    expect(abi).toMatchObject({ verified: true, abiAvailable: true, provenance: "verified_abi" });
    expect(source).toMatchObject({ verified: true, sourceAvailable: true, provenance: "verified_source" });
  });

  it("keeps API failures and rate-limit metadata observable", () => {
    const result = normalizeVerificationEvidence("0x0000000000000000000000000000000000000001", {
      status: "api_failure",
      httpStatus: 429,
      retryAfterMs: 1_000,
      detail: "rate limited",
    });

    expect(result).toMatchObject({
      status: "api_failure",
      httpStatus: 429,
      retryAfterMs: 1_000,
      provenance: "none",
    });
  });

  it("turns provider exceptions into API failures rather than findings", async () => {
    const provider: VerificationProvider = {
      lookup: async () => {
        throw new Error("provider unavailable");
      },
    };
    const result = await new VerificationClient(provider, 100).lookup("0x0000000000000000000000000000000000000001");

    expect(result).toMatchObject({
      status: "api_failure",
      verified: false,
      provenance: "none",
      detail: "provider unavailable",
    });
  });

  it("maps a slow provider to a deterministic timeout", async () => {
    const provider: VerificationProvider = {
      lookup: async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        return { status: "verified", data: { sourceCode: "contract Slow {}" } };
      },
    };
    const result = await new VerificationClient(provider, 100).lookup("0x0000000000000000000000000000000000000001");

    expect(result).toMatchObject({ status: "verified", verified: true, provenance: "verified_source" });
  });
});
