import { describe, expect, it } from "vitest";
import { JsonRpcClient } from "../../src/infra/json-rpc.js";

describe("optional live RPC integration", () => {
  it.skipIf(!process.env.VERIDEX_RPC_URL || !process.env.VERIDEX_TEST_ADDRESS)("reads deployed bytecode from a configured RPC", async () => {
    const client = new JsonRpcClient(process.env.VERIDEX_RPC_URL as string);
    const code = await client.getCode(process.env.VERIDEX_TEST_ADDRESS as string);
    expect(code).toMatch(/^0x(?:[0-9a-fA-F]{2})*$/);
  });
});
