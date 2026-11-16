# Telegraph evaluator requirements — reconciled 16 November 2026

## Current Season II destination

- Target Intent: `SMART_CONTRACT_AUDIT`.
- Published class: **Hybrid**, in the current Season II shared Intent catalogue.
- Mission: #202 — Web3 Native & DeFi; track: Evaluators.
- Mission #202 requires the actual live node class, family and scorer path to control implementation. The catalogue is the current public classification, not proof that the live node resolves the Intent or has miners.
- Historical bounty #128 wording about `SMART_CONTRACT_AUDIT_GENERAL` as Judgment is superseded for current planning. Do not use that identifier unless the live node explicitly returns it.
- The adapter-kit pin in `baseline.lock` is `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. Its compiled offline catalogue does not list `SMART_CONTRACT_AUDIT`; `ResolveClass` therefore refuses to build an adapter for it. The current public class is Hybrid, but a compatible kit revision or maintainer-confirmed official path is still needed before adapter training/export.
- Hybrid scoring combines a comparator for the checkable portion with a model-based evaluator for the judgment portion. The actual live scorer may inherit a family module; verify the resolved scorer and do not guess the family prefix.

## Official evaluation-pool rules

- Hybrid and Judgment question rows use better/worse examples. The question pool activates only after at least **five distinct contributors** have eligible material. Samples draw evenly across contributors.
- Truth sources serve the checkable part of Hybrid Intents. There is no five-contributor minimum for truth sources; one valid source can be enough for an Intent to be scored.
- Each upload is one JSONL file for one Intent. Question rows support `preference_pair`, `ground_truth`, and `graded_exemplar`. Truth-source rows use `label_kind: truth_source` and a separate `source` field, with no prompt/answer fields.
- A truth source is a public, no-key HTTPS API described using the miner YAML schema. It must expose an endpoint for `SMART_CONTRACT_AUDIT` (or wildcard) and match the exact Intent request/response shape.
- Rows start in `quarantine`; `admitted` means checks passed but the row waits for a snapshot; `eligible` means it is in a frozen snapshot; only eligible rows are used.
- HTTP 200 means the file was read, not that every row is eligible. Check each row and the active snapshot separately.
- Upload requires an EIP-191 signature over the exact body hash, fresh nonce and chain ID. No upload or signature is performed by the automated repo workflow.

## Adapter requirements (conditional)

Build an adapter only if live scoring resolution requires one. Current published docs describe a safetensors LoRA delta on the shared ModernBERT foundation, `abi=lora-v1`, `format_version=1`, rank at most 16, package at most 64 MiB, exact foundation/tokenizer hashes and a runnable URL that reproduces scores bit-for-bit. Registration requires a bond and gas; never use a guessed class or package format.

The pinned kit's missing Intent entry is a blocker, not a reason to modify a local catalogue and pretend it is supported.

## Evaluation material quality

Use primary evidence, source URLs, pinned commits, chain/block identifiers, affected contract/function, preconditions, impact and remediation. Include correct, incorrect, incomplete and ambiguous cases. Prevent prompt duplication and answer-length/style shortcuts. Run the compatible official kit's data checks and held-out tests. Local validation cannot authenticate reviewers or establish pool eligibility.

## Current project state

- 1,064 SCVD metadata records and a curated 30-case pilot are preserved from 31 October 2026; not statistically representative.
- All 30 pilot cases remain unreviewed by independent humans.
- `pairs.jsonl` remains empty.
- No truth source has been uploaded.
- No official evaluation rows are eligible.
- No adapter has been trained, exported, packaged, hosted or registered.
- No live node response has yet been recorded by the new workflow; the read-only live evidence workflow has been added to collect it.
- No wallet signature, bond, claim, payment or final submission has occurred.

## Official references

- https://hackathon.telegraphprotocol.com/intents
- https://hackathon.telegraphprotocol.com/rules
- https://anjoman.ai/docs/protocol/how-it-works
- https://anjoman.ai/docs/scoring/contribute-evaluation-data
- https://anjoman.ai/docs/scoring/build-a-scoring-module
