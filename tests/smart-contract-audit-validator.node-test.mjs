import test from "node:test";
import assert from "node:assert/strict";
import { validateRows } from "../scripts/validate-smart-contract-audit-data.mjs";

test("empty dataset fails closed", () => {
  const result = validateRows([]);
  assert.equal(result.ok, false);
});

test("generated provenance is never counted as human attestation", () => {
  const rows = [{
    prompt: "Review the supplied Solidity code and explain the concrete access-control risk.",
    chosen: "The privileged operation is reachable without the required role check, so an arbitrary external caller can change the protected state. Confirm the call path and deployment configuration before assigning severity.",
    rejected: "The operation is safe because its name suggests an administrative purpose. A function that looks administrative is normally called only by trusted accounts, so no separate authorization review is necessary.",
    label_kind: "preference_pair",
    provenance: { source_kind: "generated", source_url: "https://docs.openzeppelin.com/contracts/5.x/access-control" }
  }];
  const result = validateRows(rows);
  assert.equal(result.provenance.generatedUnverified, 1);
  assert.equal(result.readyForPoolSubmission, false);
});

test("duplicate prompts are rejected after whitespace normalization", () => {
  const rows = [
    { prompt: "Review this contract for reentrancy risk.", chosen: "A finding with specific evidence.", rejected: "A different plausible but incorrect analysis." },
    { prompt: "Review  this contract for reentrancy risk.", chosen: "Another finding with specific evidence.", rejected: "A separate plausible but incorrect analysis." }
  ];
  const result = validateRows(rows);
  assert.ok(result.failures.some((message) => message.includes("duplicate normalized prompt")));
});

test("an HTTP URL alone does not make a non-human source attested", () => {
  const rows = [{
    prompt: "Review the role assignment and privileged function access path in this contract.",
    chosen: "The role is granted only to the configured administrator and the privileged entry point enforces that role. The supplied evidence does not demonstrate an unauthorized state-changing path.",
    rejected: "The function is vulnerable because it is public in the ABI. Public visibility always means that any external account can bypass the access-control modifier and execute the privileged operation.",
    provenance: { source_kind: "public_reference", source_url: "https://docs.openzeppelin.com/contracts/5.x/access-control" }
  }];
  const result = validateRows(rows);
  assert.equal(result.provenance.selfDeclaredHumanWithUrl, 0);
  assert.equal(result.readyForPoolSubmission, false);
});

test("rejected-answer uniqueness uses the same Unicode and whitespace normalization", () => {
  const rows = [
    { prompt: "Review the first contract operation for its concrete authorization boundary.", chosen: "The supplied role modifier restricts the operation to the configured administrator and the call path confirms the check.", rejected: "This operation is safe because the function name sounds administrative and no additional checks are needed." },
    { prompt: "Review the second contract operation for its concrete authorization boundary.", chosen: "The call path applies the configured role check before the protected state transition and no bypass is shown.", rejected: "This operation is safe because the function   name sounds administrative and no additional checks are needed." }
  ];
  const result = validateRows(rows);
  assert.equal(result.metrics.uniqueRejectedFraction, 0.5);
  assert.equal(result.metrics.maxRejectedShare, 1);
  assert.ok(result.failures.some((message) => message.includes("unique rejected answers")));
});


test("canonical node Intent id is accepted and family prefix is rejected", () => {
  const base = {
    prompt: "Assess whether the supplied contract has a reachable unauthorized state-changing path.",
    chosen: "The access-controlled entry point checks the configured role before changing protected state, and the supplied call path shows no bypass.",
    rejected: "The contract is vulnerable because its function is public in the ABI, which means any caller can ignore the modifier and change protected state."
  };
  assert.equal(validateRows([{ ...base, intent_id: "SMART_CONTRACT_AUDIT_GENERAL" }]).failures.some((x) => x.includes("intent_id")), false);
  assert.equal(validateRows([{ ...base, intent_id: "SMART_CONTRACT_AUDIT" }]).failures.some((x) => x.includes("intent_id")), true);
});

test("Hybrid truth-source object is accepted by local structural preflight", () => {
  const row = {
    label_kind: "truth_source",
    intent_id: "SMART_CONTRACT_AUDIT_GENERAL",
    source: {
      version: "1",
      kind: "miner",
      id: 9001,
      slug: "veridex-public-audit-truth",
      name: "Veridex public audit evidence source",
      base_url: "https://example.org",
      auth: { type: "none" },
      semantics: { supported_intents: ["SMART_CONTRACT_AUDIT_GENERAL"] },
      endpoints: [{ path: "/audit", method: "POST", description: "Return public evidence for the requested audit", intents: ["SMART_CONTRACT_AUDIT_GENERAL"] }]
    }
  };
  const result = validateRows([row]);
  assert.equal(result.ok, true);
  assert.equal(result.material.truthSources, 1);
  assert.equal(result.readyForPoolSubmission, false);
});

test("ground_truth rows require chosen answer and reject malformed null values safely", () => {
  const good = {
    label_kind: "ground_truth",
    prompt: "Determine whether the specified privileged operation is reachable by an untrusted caller.",
    chosen: "The supplied evidence does not demonstrate an untrusted path to the privileged operation."
  };
  assert.equal(validateRows([good]).ok, true);
  const bad = validateRows([{ ...good, chosen: null }]);
  assert.equal(bad.ok, false);
  assert.ok(bad.failures.some((x) => x.includes("requires non-empty chosen")));
});
