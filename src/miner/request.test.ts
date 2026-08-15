import { describe, expect, it } from "vitest";
import { normalizeMinerRequest } from "./request.js";

describe("Miner request normalization", () => {
  it("normalizes Ethereum labels to chain id 1", () => {
    expect(normalizeMinerRequest({ chain: "ethereum", contractAddress: "0x0000000000000000000000000000000000000001" })).toEqual({
      chain: "1",
      contractAddress: "0x0000000000000000000000000000000000000001",
    });
    expect(normalizeMinerRequest({ chain: "1", contractAddress: "0x0000000000000000000000000000000000000001" })?.chain).toBe("1");
  });

  it("rejects unsupported chains and malformed addresses", () => {
    expect(normalizeMinerRequest({ chain: "polygon", contractAddress: "0x0000000000000000000000000000000000000001" })).toBeUndefined();
    expect(normalizeMinerRequest({ chain: "1", contractAddress: "not-an-address" })).toBeUndefined();
    expect(normalizeMinerRequest({ chain: "1", contractAddress: "0x0000000000000000000000000000000000000001", codeAddress: "bad" })).toBeUndefined();
  });
});
