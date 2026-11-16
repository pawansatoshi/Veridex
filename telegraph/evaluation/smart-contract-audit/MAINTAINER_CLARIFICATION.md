# Maintainer clarification request — SMART_CONTRACT_AUDIT

## Observed discrepancy (16 November 2026)

The Season II catalogue labels the family `SMART_CONTRACT_AUDIT` as Hybrid. The live testnet node returns:
- canonical child `SMART_CONTRACT_AUDIT_GENERAL`, `canonical: true`, `miner_count: 18`;
- Intent detail `class: judgment`, `request: null`, `response: null`;
- family and child scorer resolution `class: judgment`, `served_by: GENERIC`, `generic_fallback: true`, `routed: true`;
- evaluation pool for the child: 302 eligible, 3 total submitters, 2 eligible submitters, minimum 5.

The public adapter kit pin `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd` contains neither `SMART_CONTRACT_AUDIT` nor `SMART_CONTRACT_AUDIT_GENERAL` in its compiled class catalogue, so offline `adapterbuild` refuses the target.

Read-only evidence: https://github.com/pawansatoshi/Veridex/actions/runs/43814704469

## Questions

1. Is the intended live class Judgment or Hybrid?
2. Is `SMART_CONTRACT_AUDIT` the adapter registration family prefix for canonical child `SMART_CONTRACT_AUDIT_GENERAL`?
3. Should the live Intent expose a request schema and response fields for a Hybrid truth-source comparator?
4. Which adapter-kit revision or supported class mapping should Veridex use?

Veridex has not uploaded data, signed a wallet message, trained/registered an adapter, or paid any bond. We are holding those actions until the supported route is confirmed.
