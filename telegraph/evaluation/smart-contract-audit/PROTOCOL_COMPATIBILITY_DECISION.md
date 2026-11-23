# SMART_CONTRACT_AUDIT protocol compatibility — fail-closed decision

Updated 23 November 2026. This document distinguishes **implementation mitigation** from **upstream resolution**.

## Supported identity and scoring
- The published Season II catalogue calls `SMART_CONTRACT_AUDIT` a **Hybrid family** (comparator + evaluator adapter).
- The live node previously exposed `SMART_CONTRACT_AUDIT_GENERAL` as its canonical child Intent, but its detail reported `class: judgment`, no request/response schemas, and both family and child scorer lookup used `GENERIC` with `generic_fallback: true`.
- Per protocol documentation, a family prefix is not itself an Intent. Never substitute `SMART_CONTRACT_AUDIT` for the canonical child when querying miners or evaluation-pool state.
- The pinned public adapter kit lacked both identifiers in its compiled catalogue; do not bypass its supported-target checks or relabel the target as another Intent.

## Fail-closed operational rule
Before any adapter build, truth-source upload, evaluator registration or official contribution claim:
1. Capture timestamped read-only evidence with `npm run verify:audit-live`.
2. Confirm canonical child identity and the authoritative class for that child.
3. Confirm a **non-generic**, supported scorer/adapter route and compatible adapter-kit revision.
4. For a Hybrid truth source, confirm documented request and response schemas, comparator semantics and evidence format.
5. For Judgment, obtain maintainer confirmation that this route is intended and the supported adapter registration target.
6. Keep `pairs.jsonl` and any reviewer verdicts unverified until independent human review. Do not synthesize adjudication or signer identities.
7. Stop on disagreement or missing fields; log evidence and seek maintainer confirmation. Never infer that a generic fallback is a dedicated scoring implementation.

## Decision table

| Observation | Safe action |
| --- | --- |
| Catalogue Hybrid; live Judgment/generic fallback | BLOCK adapter registration and truth-source submission |
| Canonical child confirmed, but class/schema missing | Allow read-only evidence and offline structural tests only |
| Maintainer confirms Judgment with supported adapter kit | Implement Judgment adapter against documented interface; no Hybrid truth-source assumptions |
| Maintainer confirms Hybrid with documented comparator and schema | Implement Hybrid comparator/truth-source integration and supported adapter route |
| Live class changes without adapter-kit support | BLOCK; request supported kit revision |
| All compatibility checks pass but human cases remain unreviewed | BLOCK claims of verified evaluation data |

## Maintainer questions
1. Should `SMART_CONTRACT_AUDIT_GENERAL` be Hybrid or Judgment on the live node?
2. What exact adapter registration identifier and kit revision support it?
3. If Hybrid, what are the canonical request/response schemas, comparator contract and truth-source format?
4. Does the generic scorer fallback indicate a temporary unconfigured route or the intended evaluation mechanism?

## Evidence and links
- Existing read-only diagnostic: `scripts/verify-smart-contract-audit-live.mjs`
- Previous captured workflow: https://github.com/pawansatoshi/Veridex/actions/runs/43815507748
- Upstream catalogue: https://hackathon.telegraphprotocol.com/intents
- Protocol docs: https://anjoman.ai/docs/protocol/how-it-works
- Tracking issue: https://github.com/pawansatoshi/Veridex/issues/258

**Status: mitigation documented; upstream mismatch NOT resolved.** No upload, bond, signature, adapter registration, or official hackathon submission is claimed.
