import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const minerYamlPath = new URL("../../telegraph/miner.yaml", import.meta.url);
const yamlVerifierPath = new URL("../../scripts/verify-telegraph-yaml.mjs", import.meta.url);
const integrationVerifierPath = new URL("../../scripts/verify-telegraph-integration.mjs", import.meta.url);

function configuredIntents(yaml: string): string[] {
  const match = yaml.match(/semantics:\s*\n(?:.|\n)*?supported_intents:\s*\n((?:\s+-\s+[^\n]+\n?)+)/m);
  if (!match) return [];
  return [...match[1].matchAll(/^\s+-\s+([A-Z0-9_]+)\s*$/gm)].map((entry) => entry[1]);
}

describe("Telegraph Miner configuration", () => {
  it("declares exactly the canonical Veridex H1 intent", async () => {
    const yaml = await readFile(minerYamlPath, "utf8");
    expect(configuredIntents(yaml)).toEqual(["FRAUD_DETECTION"]);
  });

  it("has exact-intent checks in both live verification gates", async () => {
    const [yamlVerifier, integrationVerifier] = await Promise.all([
      readFile(yamlVerifierPath, "utf8"),
      readFile(integrationVerifierPath, "utf8"),
    ]);

    expect(yamlVerifier).toContain("configured.length !== 1 || configured[0] !== expectedIntent");
    expect(yamlVerifier).toContain("!canonical.has(expectedIntent)");
    expect(integrationVerifier).toContain("advertisedIntents.length !== 1 || advertisedIntents[0] !== expectedIntent");
    expect(integrationVerifier).toContain("!canonicalIntents.has(expectedIntent)");
  });
});
