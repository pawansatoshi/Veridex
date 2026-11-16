# Veridex — SMART_CONTRACT_AUDIT evaluator contribution

**Season II family label:** `SMART_CONTRACT_AUDIT`  
**Live canonical node Intent:** `SMART_CONTRACT_AUDIT_GENERAL`  
**Season II published class:** Hybrid; **live node scorer resolution:** Judgment via generic fallback (discrepancy under maintainer review)  
**Mission:** Telegraph Season II Mission #202 — Web3 Native & DeFi  
**Track:** Evaluators  
**State:** engineering scaffold + live evidence workflow; official pool contribution not yet submitted.

## Outcome

Veridex is building a reproducible, evidence-first evaluation contribution for smart-contract audit intelligence. It checks whether a miner's assessment is supported by the correct source revision, code path, exploit preconditions, impact and uncertainty—not whether an answer merely sounds plausible.

For this Hybrid Intent, the intended contribution has two components, subject to live node confirmation:
1. Truth-source material for the checkable part of the Intent.
2. Balanced question/answer evaluation material for the judgment component, and a compatible evaluator adapter only if the live scoring path requires one.

## Current engineering

- SCVD public metadata fetcher and curated 30-case pilot review queue.
- Explicitly unreviewed source register; no synthetic human labels.
- Fail-closed validator for official question rows and truth-source row shapes.
- Live, read-only protocol evidence script for Intent registry, miner supply, scorer resolution and evaluation-pool state.
- GitHub Actions workflow to capture live evidence and preserve a 30-day artifact.
- Unit tests for schema validation and live evidence parsing.

## Critical requirements

- The Season II catalogue labels the family `SMART_CONTRACT_AUDIT` as Hybrid. The live node registry identifies `SMART_CONTRACT_AUDIT_GENERAL` as the canonical child Intent, with 18 miners. The live `/api/wasm?resolve=` endpoint currently reports `judgment`, `served_by: GENERIC`, `generic_fallback: true` for both the family and child. The live Intent detail returns `request: null` and `response: null`. This is a material catalogue/node discrepancy; maintainer clarification is required before deciding whether to build Hybrid truth-source material or a Judgment-only adapter.
- The live node's canonical Intent record, request/response schema, miner supply, scorer resolution and pool status must be captured before creating any official truth source.
- Hybrid question material is used only when the evaluation pool has at least five distinct contributors. Truth sources have no five-contributor minimum; one eligible source can provide the checkable reference.
- Every row begins in quarantine. Only row-level `eligible` material in the active frozen snapshot is actually used.
- An upload is an account-holder-signed action. No signature or upload has been performed.
- The adapter-kit pin in `baseline.lock` does not compile-resolve `SMART_CONTRACT_AUDIT`. The published class is Hybrid, but the exact compatible kit/catalogue path needs maintainer confirmation before training or packaging.

## Pilot status

The preserved 31 October 2026 snapshot has 1,064 metadata records and a curated 30-case shortlist across 24 repositories. It is not representative. All 30 cases remain `needs_independent_human_review`; `pairs.jsonl` remains empty. The AI Arena H-08 candidate is historical and marked mitigated; Beanstalk and Dropbox candidates have unresolved taxonomy. None may be treated as gold labels.

## Validation

Run:
```bash
npm run test:audit-data
npm run validate:audit-data
npm run verify:audit-live
```

The empty dataset is expected to fail the data readiness validator. The live evidence command is read-only and does not sign, upload, bond, register or pay. It records evidence but cannot establish row eligibility unless the live node returns it.

## Official references

- [Season II Intent catalogue](https://hackathon.telegraphprotocol.com/intents)
- [Season II rules](https://hackathon.telegraphprotocol.com/rules)
- [Mission #202](https://github.com/telegraphprotocol/bounties/issues/202)
- [Evaluation material guide](https://anjoman.ai/docs/scoring/contribute-evaluation-data)
- [Evaluator adapter guide](https://anjoman.ai/docs/scoring/build-a-scoring-module)
- [How Telegraph scoring works](https://anjoman.ai/docs/protocol/how-it-works)

## Honest status

The live pool for `SMART_CONTRACT_AUDIT_GENERAL` reports 302 eligible rows, 11 admitted, 71 quarantine, 2 rejected, 3 submitters but only 2 eligible submitters (minimum 5). These are existing pool records, not Veridex uploads. No human-reviewed gold pairs from this repository, official truth source, official evaluation upload, adapter package, adapter registration, wallet signature, or final hackathon submission is claimed by this repository at this stage. PR #256 is open, Draft and unmerged.
