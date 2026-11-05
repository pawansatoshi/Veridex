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
  assert.equal(result.provenance.humanWithUrl, 0);
});
