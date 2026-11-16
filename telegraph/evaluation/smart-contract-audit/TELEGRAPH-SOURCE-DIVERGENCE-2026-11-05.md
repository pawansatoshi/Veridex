# Telegraph evaluator requirements and mission transition
**Reconciled: 16 November 2026**

## Issue #128 state

[Telegraph bounty #128](https://github.com/telegraphprotocol/bounties/issues/128) is closed with reason `not_planned` as of 15 November 2026. The maintainer's closing comment says the work continues in the Season II missions served by this Intent:
- [#189 — Exchange](https://github.com/telegraphprotocol/bounties/issues/189)
- [#202 — Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202)

Issue #128's `status:open` label is stale; GitHub's actual issue state is closed. The issue remains labelled `reward:unfunded`. It says there is no standalone GitHub payout; Season II prizes and protocol earnings are separate and eligibility-dependent.

The current issue body describes `SMART_CONTRACT_AUDIT_GENERAL` as a judgment Intent in the `SMART_CONTRACT_AUDIT` family and describes the adapter as a safetensors LoRA delta for the shared ModernBERT Foundation Model. This is consistent with the current Train/Build documentation. The previous note claiming the issue and Train guide required a full-model WASM package was obsolete and is superseded by this document.

## Mission evaluator requirements

Mission #202 explicitly includes SMART_CONTRACT_AUDIT in its Evaluators route. It instructs contributors to use the selected Intent's actual node class, family and scoring path:
- Deterministic: public truth-source material and supported comparator path.
- Hybrid: truth-source/comparator plus judgment contribution where the live scoring path uses it.
- Judgment: sourced, balanced better/worse examples and a compatible evaluation adapter where needed.

Do not infer a live node class from a name, an old issue, or an adapter-kit guess. The published issue/catalogue describe judgment; live node `intentKind()`, canonical Intent and scorer routing still need independent verification.

## Adapter-kit compatibility

Pinned adapter-kit: `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`.

At this pin, the compiled scoring catalogue has no `SMART_CONTRACT_AUDIT` family entry. The offline resolver strips `_GENERAL`, looks up the base family and rejects it as unknown. An explicit class flag does not create a missing catalogue entry.

Required gate:
1. Obtain live Intent details and scorer resolution, or a reproducible on-chain class proof with chain/block.
2. Ask maintainers for an official compatible adapter-kit/catalogue revision or supported extension process.
3. Only then run the official training/export/package workflow. Do not add a fabricated catalogue entry or guess the class.

Official references:
- [Published Intents](https://github.com/telegraphprotocol/bounties/blob/main/docs/INTENTS.md)
- [Mission #202](https://github.com/telegraphprotocol/bounties/issues/202)
- [Train an Evaluator Adapter](https://anjoman.ai/docs/scoring/train-a-scoring-adapter)
- [Build an Evaluator Adapter](https://anjoman.ai/docs/scoring/build-a-scoring-module)
- [Contribute Evaluation Data](https://anjoman.ai/docs/scoring/contribute-evaluation-data)
- [Adapter-kit pinned class resolver](https://github.com/telegraphprotocol/telegraph-wasm-baseline/blob/1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd/pkg/adapterbuild/class.go)
- [Adapter-kit compiled catalogue](https://github.com/telegraphprotocol/telegraph-wasm-baseline/blob/1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd/pkg/scoring/catalog/catalog.go)

## SCVD evidence and dataset status

The preserved 31 October metadata artifact contains 1,064 source records and a curated 30-case pilot across 24 repositories. The GitHub artifact expired 14 November; the local archive is preserved with SHA-256 `f44ac6d05dc2b5f668f6b7e2f338745bdeb7da2fb80a66f82b25cb79c187fee3`.

Metadata coverage in that snapshot: source URL 30/30; source commit 27/30; source file 11/30; summary links 9/30; raw source references 0/30; contract name 0/30; function name 0/30.

All 30 candidates remain `needs_independent_human_review`. No preference pairs exist. AI Arena H-08 is a historically reported and mitigated reentrancy candidate; Beanstalk and Dropbox have unresolved taxonomy mismatches. These are source-triage observations, not human adjudications.

The contribution branch now includes a normalized rejected-answer duplicate check, a regression test, a CI step that invokes the actual validator when `pairs.jsonl` is populated, and 30-day SCVD artifact retention. The latest runs must be checked before claiming these changes pass.

## Participation

No `/claim` has been posted by `pawansatoshi` on issue #128, #189 or #202 in the checked comments. Claims on the current mission issues are non-exclusive and require meaningful `/progress <update>` at least every 72 hours after the bot confirms a claim. Do not claim on the user's behalf.

Issue #128 is explicitly `reward:unfunded`; no standalone GitHub payout is promised. Season II prizes are separate and eligibility-dependent.

## Non-negotiable evidence and authorization rules

- A URL, SCVD category, automated metadata field or model-generated text is not human verification.
- Do not create synthetic preference labels or reviewer attestations.
- Do not upload evaluation data, sign wallet messages, approve bonds, register adapters, deploy a scoring endpoint, claim a bounty or make payments without the relevant explicit user authorization.
- PR #256 remains Draft; do not merge or change its draft state.
