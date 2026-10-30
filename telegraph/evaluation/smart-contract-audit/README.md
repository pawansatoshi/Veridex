# SMART_CONTRACT_AUDIT — Telegraph bounty #128

This workspace is for a contribution to
https://github.com/telegraphprotocol/bounties/issues/128

## Scope

Target Intent: `SMART_CONTRACT_AUDIT_GENERAL`  
Adapter registration family: `SMART_CONTRACT_AUDIT`  
Intent class: **Hybrid** (verified against the current official H2 Intent catalogue on 2026-10-30).

The bounty asks for two separately verifiable deliverables:

1. Public evaluation material: preference pairs that are technically correct, distinct, and independently sourced.
2. A ModernBERT-based hybrid evaluator adapter packaged as a WASI WebAssembly module and accepted by Telegraph's node-side evaluation.

## Veridex fit — and the gap

Veridex already has deterministic evidence for ownership/control, proxy and upgradeability surfaces, pause controls, and mint authority. Those signals are useful audit context, especially for access-control analysis.

They do **not** establish detection of reentrancy or integer-overflow vulnerabilities. Do not label a capability observation as a confirmed vulnerability. The evaluator must reward answers that distinguish:

- confirmed source/bytecode findings from heuristics;
- exploitable paths from mere function/selector presence;
- implementation behavior from proxy storage/context;
- missing evidence from a clean bill of health;
- severity from exploitability and confidence.

## Non-negotiable evidence rules

- Use only public inputs and material we are entitled to use.
- Every contributed pair must be human-reviewed and have traceable public provenance.
- Do not upload LLM-generated/synthetic rows as `human` or imply that a generated example is independently attested.
- Do not publish hidden qualification prompts, expected answers, evaluation distributions, private node diagnostics, customer inputs, or credentials.
- Never use unpublished incumbent model weights or private evaluation data.
- A local training pass is not proof of acceptance. The node's hidden competition must promote the adapter.
- Keep signing keys local. Never commit keys or ask the assistant to handle them.

## Evaluation data format

One JSON object per line in `pairs.jsonl`:

```json
{"prompt":"Review the supplied contract excerpt for a reentrancy issue and explain the call sequence.","chosen":"...","rejected":"...","label_kind":"preference_pair","provenance":{"source_kind":"human","source_url":"https://..."}}
```

The prompt, chosen answer, and rejected answer must address the same task. The rejected answer must be plausible but technically wrong, not a stock phrase. Keep answer lengths comparable and vary the failure mode.

Before any upload:

1. Independently verify every chosen answer against its cited public source and the supplied code.
2. Have a second reviewer check vulnerability classification, exploit preconditions, impact, and remediation.
3. Run `node scripts/validate-smart-contract-audit-data.mjs --input telegraph/evaluation/smart-contract-audit/pairs.jsonl`.
4. Confirm the row is eligible through the official eval-pool status endpoint after signing/uploading it yourself.
5. Coordinate with at least four other independent contributors. The pool requires at least five distinct contributors before preference-pair material can be used.

## Public reference corpus candidates

Use these as primary technical references when constructing human-reviewed cases; cite the exact relevant section or finding per row:

- OWASP Smart Contract Top 10 2026: https://owasp.github.io/www-project-smart-contract-top-10/
- OWASP reentrancy guidance and examples: https://scs.owasp.org/SCWE/SCWE-046/
- Solidity security considerations (including reentrancy and checks-effects-interactions): https://docs.solidity.org/en/latest/security-considerations.html
- EIP-1470 / SWC test-case model: https://eips.ethereum.org/EIPS/eip-1470
- Slither detector documentation: https://github.com/crytic/slither/wiki/Detector-Documentation

A source URL alone does not make a generated row attested. A human contributor must inspect the source, validate the code-level claim, and author/review the preference judgment. Keep compiler version, EVM target, dependency version, and detector version with each case where relevant. Solidity >=0.8 checked arithmetic must not be mislabeled as overflow-prone unless the code uses `unchecked`, unsafe assembly, or another demonstrated path.

## Adapter build

Follow the current official guides, not the legacy Track 2 `rank_answer` C ABI:

- https://docs.telegraphprotocol.com/docs/scoring/train-a-scoring-adapter
- https://docs.telegraphprotocol.com/docs/scoring/build-a-scoring-module
- https://docs.telegraphprotocol.com/docs/scoring/contribute-evaluation-data

The current adapter is a float32 ONNX ModernBERT reward model packaged into a single WASI command with `telegraph.adapter` metadata (`abi_version: 2`, `runtime: onnx_f32`, `class: hybrid`). It is not the old Track 2 `rank_answer` module and not a deterministic comparator.

The documented build stages are: prepare preference pairs → train → export ONNX → bake WASM → package → host the exact artifact and runnable endpoint → register on the `SMART_CONTRACT_AUDIT` family → wait for node verification and hidden-pool competition.

A candidate replaces the incumbent only if it reaches at least 70% win rate and beats the incumbent by at least 2 percentage points on the same hidden sample. Do not claim success until the node reports promotion.

## Current state

- [x] Issue #128 checked: open, `priority:p2`, `reward:unfunded`.
- [x] Current catalogue class checked: Hybrid.
- [x] Veridex capability scope compared with audit requirements.
- [x] Local dataset quality gate added.
- [ ] Collect and independently review public-source pairs.
- [ ] Recruit independent contributors until the pool has at least five.
- [ ] Submit eligible rows through the official signed eval-pool flow.
- [ ] Train and validate the current float32 adapter on public data.
- [ ] Run the public node-compatible packaging and smoke checks.
- [ ] Register only after local checks pass and the user explicitly authorizes the on-chain transaction.
- [ ] Obtain node-side promotion evidence.
- [ ] Submit reproducible proof to bounty #128.

## Reward and claim status

The issue is currently labelled `reward:unfunded`: it commits **no bounty payment**. H2 competition prizes and protocol incentives are separate systems.

No `/claim` has been posted. Do not imply that the bounty is reserved for this contributor.
