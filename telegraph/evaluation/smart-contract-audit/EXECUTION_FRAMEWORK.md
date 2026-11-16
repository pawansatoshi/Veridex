# SMART_CONTRACT_AUDIT Evaluator — End-to-End Execution Framework

**Owner:** Pawan Satoshi / Veridex  
**Repository:** `pawansatoshi/Veridex`  
**Current contribution branch:** `bounty/smart-contract-audit-128`  
**Protocol destination:** Telegraph Season II Mission #202 — Web3 Native & DeFi  
**Primary track:** Evaluators  
**Last reconciled:** 16 November 2026  
**Priority:** P0 — resolve protocol compatibility before spending effort on training or uploads

> This document is the execution contract for the evaluator contribution. It separates official mission requirements from Veridex engineering targets and from actions that require a human reviewer, maintainer, or account-holder authorization. It is not a claim that any blocked milestone is already complete.

---

## 1. The complete goal

Build and publicly demonstrate a reproducible, evidence-first evaluation contribution that helps Telegraph distinguish high-quality from low-quality smart-contract security intelligence.

Given an evaluation request and a candidate security assessment, the evaluation system must be able to judge whether the assessment is:
- factually supported by primary evidence;
- tied to the correct chain, contract, source revision and execution context;
- correctly classified (for example reentrancy, access control, arithmetic, upgradeability or pause/mint authority);
- precise about preconditions, impact and exploitability;
- appropriately uncertain when evidence is incomplete or conflicting; and
- safer than a superficially plausible but unsupported answer.

**Expected evaluator outcome:** a defensible quality judgment backed by traceable evidence—not a claim that every contract is safe, and not a vulnerability detector inferred from metadata alone.

### Explicit non-goals
- Do not build a new Intent merely because a family name is missing from a local adapter catalogue.
- Do not assume `SMART_CONTRACT_AUDIT_GENERAL` is callable or that it uses a judgment adapter until live node/scorer evidence confirms this.
- Do not manufacture chosen/rejected answers, reviewer identities, review timestamps, provenance or exploit evidence.
- Do not train or export an adapter before the official scoring path and compatible adapter-kit revision are confirmed.
- Do not upload data, sign wallet messages, bond, register an adapter, pay, claim a mission or submit an entry without the required explicit authorization.
- Do not present this evaluator-only contribution as completion of the entire Mission #202 product/app route.

---

## 2. Official mission requirements vs. our project targets

### Official requirements from Mission #202
The mission says evaluator work must follow the selected Intent's **actual live node class, family and scoring path**:
- **Deterministic:** provide reliable public truth-source material and use the supported comparator. A new judgment adapter is not automatically needed.
- **Hybrid:** provide the checkable truth source/comparator and the judgment contribution actually used by the live path.
- **Judgment:** provide sourced, balanced better/worse examples and a compatible evaluation adapter where required.

Across these paths, evaluation material must use primary evidence, timestamps, chain/block or jurisdiction identifiers, correct units and tolerances; include correct, incorrect, incomplete and ambiguous cases; resist shortcuts based on answer length, keywords or copied wording; and be tested on unseen sources and failure types. The contributor must verify the material's **eligible/rejected** state and the scoring module's actual status separately. A local pass or upload acknowledgement is not canonical acceptance.

### Veridex project targets (engineering choices, not official minimums)
1. Make a clean, reproducible source-to-evidence review pipeline.
2. Produce an independently adjudicated pilot before scaling.
3. Enforce data-quality and anti-shortcut checks in CI.
4. Use the smallest compatible scoring contribution required by the confirmed live route.
5. Publish a reproducible evaluator demonstration with honest limitations and proof.

### Mission dates currently published
- Progress showcase: **20 November 2026**.
- Main Season II deadline: **1 December 2026, 23:59 UTC**.
- The official submission form is separate from GitHub mission comments. Re-check the live rules/form before submission.

---

## 3. Architecture and data flow

```text
Canonical Intent + live node/scorer evidence
                  |
                  v
       Route classifier (deterministic /
             hybrid / judgment)
                  |
                  v
       Primary source registry
  (audit report, commit, file, function,
      chain, block, deployment context)
                  |
                  v
      Human review and adjudication
       (reviewer A + reviewer B)
                  |
                  v
       Gold evidence case records
  (valid / invalid / incomplete / ambiguous)
                  |
                  v
   Official material-format conversion
                  |
                  v
   Local schema + quality + leakage gates
                  |
                  v
  Official Anjoman Evaluate upload (human)
                  |
                  v
    Eligible/rejected row-state verification
                  |
                  v
    Scoring module / adapter (only if needed)
                  |
                  v
  Held-out evaluation + failure-case report
                  |
                  v
 Reproducible public-safe submission package
```

No stage may silently promote metadata into ground truth. Each transformation must preserve source provenance and produce an auditable artifact.

---

## 4. P0 — Resolve the live protocol route (blocking gate)

**Do this before authoring preference labels or training.**

1. Query the live canonical Intent list and confirm the exact `intent_name`; do not infer it from a family name or append `_GENERAL` by guesswork.
2. Retrieve the exact request schema, `request.params`, response fields and example response.
3. Confirm at least one active Provider and run a harmless public/testnet diagnostic request if available.
4. Capture the actual node class, family, scorer path and whether the path consumes truth-source material, preference pairs, a judgment adapter, or a combination.
5. Check whether the current adapter-kit supports the family and class. The currently pinned kit revision is `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`; its compiled catalogue was previously found not to contain `SMART_CONTRACT_AUDIT`.
6. Obtain a maintainer-confirmed compatible kit/catalogue revision or an officially supported contribution route. Never edit a local catalogue to pretend the network supports it.

**Gate P0 passes only when** the exact canonical Intent, live request schema, node class/scorer path, required contribution type and compatible tooling are documented with dated evidence.

**If the route is not callable or the family is unsupported:** stop adapter work. Record the exact request, response, endpoint, timestamp and expected/actual behavior; ask maintainers for the supported route. In parallel, assess whether a supported deterministic truth-source/comparator contribution is valid. Do not silently substitute a different Intent and call it the same work.

---

## 5. P1 — Build a defensible gold dataset

### 5.1 Source hierarchy
Use, in order:
1. Original audit reports and contest findings.
2. Commit-pinned source code and exact affected file/function.
3. Reproduction tests, transaction traces, chain/block evidence or a precise static execution path.
4. Maintainer fixes and post-mortems as corroboration—not as sole proof that a current deployment remains vulnerable.
5. Aggregators and vulnerability databases only as discovery indexes, never as final ground truth.

### 5.2 Required fields for every case
- Stable case ID and vulnerability taxonomy.
- Canonical source URL and original report URL.
- Repository, immutable commit SHA, file path, contract and function where available.
- Chain/network and block or deployment context where relevant.
- Preconditions, attacker capability and affected asset/state.
- Exact vulnerable code path and evidence excerpt/reference.
- Impact and exploitability rationale.
- Status: confirmed, mitigated, not reproducible, taxonomy mismatch, incomplete, or ambiguous.
- Reviewer A and Reviewer B identities, timestamps and independent decisions.
- Disagreement resolution and reviewer notes.
- Data licence/redistribution note and safe-publication classification.

Missing evidence must remain explicitly missing. A taxonomy tag, severity label or repository URL is not proof.

### 5.3 Human adjudication protocol
1. Reviewer A independently inspects the original report and pinned source.
2. Reviewer B repeats the assessment without seeing A's conclusion.
3. Each reviewer records classification, evidence, preconditions, impact and confidence.
4. Disagreements go to a third adjudicator or remain unresolved and are excluded from gold labels.
5. Only independently agreed cases enter the gold dataset.
6. Keep an immutable audit trail of changes; never overwrite a prior decision without recording why.

### 5.4 Balanced evaluation coverage
Include:
- true positive: valid, evidenced vulnerability;
- true negative: plausible concern disproved by the cited code path;
- incomplete: insufficient source/context to decide;
- ambiguous: conflicting reports or unresolved taxonomy;
- mitigated/historical: issue existed in a pinned revision but is fixed in the assessed revision;
- failure cases: wrong chain, stale commit, missing file, proxy/implementation mismatch, unavailable RPC, contradictory sources.

The existing 30-case SCVD pilot is a **review queue only**. It is curated, not random or representative; all 30 records are still unreviewed. Beanstalk and Dropbox triage items have unresolved taxonomy and must not be labelled as gold. AI Arena H-08 is a candidate for reproduction, not proof of current exploitability.

---

## 6. P2 — Convert reviewed cases into official evaluation material

1. Read the current Anjoman material-format and provenance specification at the time of upload.
2. Map the adjudicated cases into the exact official schema. Keep Veridex's internal JSONL format separate from the official upload format unless the current documentation explicitly says they are identical.
3. For judgment routes, create balanced better/worse examples that differ in security reasoning—not merely answer length, tone or keywords.
4. Include incomplete and ambiguous examples so the evaluator learns to abstain or express uncertainty.
5. Split train/dev/held-out by source repository, report family and time where possible. Prevent near-duplicate findings or paraphrases crossing splits.
6. Store a manifest with source hashes, case IDs, split assignment, transformation version and generation timestamp.
7. Run the local validator and the official adapter-kit checks. Preserve full logs and validator version.

### Known quality thresholds from the currently documented adapter-kit checks
- Unique rejected answers: at least **80%**.
- Maximum share for any one rejected answer: **2%**.
- Identical chosen/rejected pairs: at most **1%**.
- Length-only shortcut accuracy: at most **65%**.
- Held-out leakage: at most **10%**.
- Surface-style shortcut accuracy: at most **65%**.

Reconfirm these thresholds against the compatible kit revision before treating them as final. Passing local checks does not establish human review or Anjoman eligibility.

**Current repo state:** `pairs.jsonl` is empty by design. CI tests the validator and reports empty data as not submission-ready. This is an honest scaffold state, not a completed dataset.

---

## 7. P3 — Scoring module / adapter (conditional)

Only execute this phase if P0 proves the live route requires a judgment adapter.

1. Pin the maintainer-confirmed adapter-kit commit and shared base-model revision.
2. Confirm supported family, node class, input/output contract and LoRA ABI.
3. Follow the current supported format (published docs currently describe a safetensors LoRA delta, `abi=lora-v1`, `format_version=1`, on shared ModernBERT; verify this again before use).
4. Train only on adjudicated, eligible material. Keep held-out cases untouched.
5. Export with the official toolchain; validate tensor names, shapes, base-model identity, metadata and artifact integrity.
6. Run offline scoring and unseen-source tests. Compare against the baseline and simple shortcut baselines.
7. Package a reproducible model card: data provenance, training config, hashes, metrics, failure modes, known limitations and intended use.
8. Have the account holder/authorized operator perform any upload, registration, signing, bond or deployment action.

If the live route is deterministic or hybrid and does not require a new adapter, do not train one just to create an artifact. Deliver the supported truth-source/comparator or hybrid component instead.

---

## 8. P4 — Evaluation and acceptance test matrix

| Test family | Required behavior | Evidence to preserve |
|---|---|---|
| Correct vulnerability | Recognizes the issue and cites the exact path | Case ID, source SHA, expected/actual |
| False positive | Rejects unsupported vulnerability claim | Counter-evidence and rationale |
| Historical mitigation | Distinguishes vulnerable old revision from fixed revision | Both commit SHAs and fix evidence |
| Proxy/implementation | Resolves the correct implementation and upgrade context | Proxy slot/implementation evidence |
| Access control | Checks role/owner path, not ABI visibility alone | Modifier and call-path evidence |
| Reentrancy | Identifies state/callback ordering and reachable path | Call trace or source reasoning |
| Arithmetic | Checks compiler/version, bounds and reachable inputs | Types, constraints and test evidence |
| Missing context | Abstains or marks uncertain | Missing-field report |
| Conflicting sources | Surfaces conflict; does not force a safe verdict | Both source records |
| Infrastructure failure | Reports unavailable RPC/provider as an error, not a contract finding | Raw error and timestamp |
| Shortcut resistance | Cannot pass by answer length/style/keywords | Official quality-check logs |
| Generalization | Works on unseen repos/reports/failure types | Held-out manifest and metrics |

Never claim a contract is safe merely because no vulnerability was found in an incomplete scan. The output must distinguish **no issue observed**, **verified safe under stated scope**, and **unable to determine**.

---

## 9. P5 — Submission and public proof package

The evaluator contribution is ready for external review only when all applicable evidence exists:

- [ ] Exact canonical Intent and live route evidence.
- [ ] Official scoring path and required material type documented.
- [ ] Source register with immutable evidence references.
- [ ] Human-reviewed gold cases with two independent reviewers and disagreement handling.
- [ ] Balanced material in the official schema.
- [ ] Local validator and official quality checks pass.
- [ ] Official upload response recorded.
- [ ] Every row's eligible/rejected state checked.
- [ ] Actual scoring module/adapter status verified, if applicable.
- [ ] Held-out evaluation report includes success and failure cases.
- [ ] Reproduction instructions work for an independent reviewer.
- [ ] Costs, latency, limitations and testnet/production status are clearly stated.
- [ ] Public-safe repo/demo and a short walkthrough are available.
- [ ] At least three meaningful original progress updates are published on separate dates for the mission's growth rubric.
- [ ] Final entry is made through the official Anjoman submission form when open; GitHub `/submit` is coordination only.

Mission #202's overall mission also describes a customer-facing workflow and authentic paid Telegraph request evidence. This evaluator-only work does **not** satisfy the full Apps & Agents route by itself. If pursuing the app track later, scope it separately as a risk-preflight workflow with its own runnable demo, paid request/receipt, useful action and failure case.

---

## 10. High-priority execution schedule

### 16 November — P0 route and blocker resolution
- [ ] Inspect live Intent list and exact schema.
- [ ] Confirm Provider availability and node/scorer route.
- [ ] Confirm adapter-kit compatibility with maintainers.
- [ ] Record a go/no-go decision: deterministic, hybrid, judgment, or unsupported.
- [ ] Freeze unrelated feature work until this decision is recorded.

### 17 November — P1 source adjudication begins
- [ ] Rebuild the SCVD review queue from the current public source.
- [ ] Replace weak candidates with primary-report-backed candidates.
- [ ] Obtain two independent human reviewers.
- [ ] Complete a small adjudicated pilot; unresolved cases remain excluded.

### 18 November — P2 material and quality gates
- [ ] Convert reviewed cases to the current official format.
- [ ] Run local and official validators.
- [ ] Fix schema, provenance, balance, leakage and shortcut failures.
- [ ] Publish a reproducible validation report.

### 19 November — P3/P4 conditional integration
- [ ] If judgment path is confirmed, train/export only with supported tooling and eligible data.
- [ ] Otherwise implement the deterministic/hybrid contribution actually required.
- [ ] Run success, false-positive, uncertainty and infrastructure-failure tests.

### 20 November — Progress showcase checkpoint
- [ ] Publish only what is genuinely reproducible.
- [ ] Demonstrate the evaluator contribution and its limitations.
- [ ] Record independent feedback and next blockers.
- [ ] Do not label an unfinished dataset or unregistered adapter as complete.

### 21 November–1 December — Final hardening and submission
- [ ] Expand held-out coverage and repeatability.
- [ ] Confirm eligible rows and module status in Anjoman.
- [ ] Prepare model/data cards, hashes, demo and walkthrough.
- [ ] Complete three separate-date progress updates and adoption evidence.
- [ ] Submit through the official form before **1 December 2026, 23:59 UTC**.

Dates are internal priority targets. Human review, maintainer response and official platform state may block a phase; do not fabricate completion to meet a date.

---

## 11. Current baseline and blockers (16 November 2026)

### Already present in Veridex
- SCVD public metadata fetcher and deterministic 30-case pilot builder.
- Source register, coverage matrix and preliminary triage notes.
- Fail-closed preference-pair validator and regression tests.
- CI integration for validator tests and non-empty dataset validation.
- Review-queue workflow configured for 30-day artifact retention.
- Documentation of provenance and protocol limitations.

### Not complete
- Live canonical Intent request schema and actual scorer route have not been independently verified.
- Pinned adapter-kit catalogue lacks `SMART_CONTRACT_AUDIT`; compatible revision is not confirmed.
- All 30 pilot cases need independent human review.
- `pairs.jsonl` is empty.
- No official evaluation data has been uploaded.
- No row eligibility has been confirmed.
- No adapter has been trained, exported, packaged, hosted or registered.
- No live scoring module status or held-out benchmark is available.
- No final Anjoman submission has been made.

### Mission coordination
- Original bounty #128 is closed as `not_planned` and marked unfunded; do not treat it as the active paid bounty.
- Current destination is Season II Mission #202 for the SMART_CONTRACT_AUDIT Evaluators route. Mission #189 is a related Exchange customer workflow, not a substitute for evaluator acceptance criteria.
- Claims are non-exclusive and require 72-hour progress updates. No claim has been made by this project owner; claiming is a separate deliberate action and is not part of this automated execution plan.

---

## 12. Decision log and stop conditions

| Decision | Rule |
|---|---|
| Intent name | Use exact live canonical identifier only |
| Scoring route | Determined from live node/scorer evidence, not labels alone |
| Adapter | Build only if the actual route requires one |
| Gold labels | Require independent human adjudication |
| Unresolved evidence | Exclude from gold data; preserve as ambiguous/incomplete |
| Local validation | Never call it network eligibility or canonical acceptance |
| Upload / wallet / bond / payment | Requires explicit account-holder authorization |
| Mission claim / submission | Requires explicit account-holder decision |
| Deadline pressure | Never overrides provenance, safety or evidence requirements |

**Stop and escalate** if the canonical Intent returns a null schema, the node does not support the family, the adapter-kit cannot resolve the family, primary evidence cannot be obtained, or reviewers disagree on a case. Record the failure precisely and ask maintainers; do not hide it with a local workaround.

---

## 13. Official references

- Telegraph Season II Mission #202 — Web3 Native & DeFi: https://github.com/telegraphprotocol/bounties/issues/202
- Telegraph Season II Mission #189 — Exchange: https://github.com/telegraphprotocol/bounties/issues/189
- Live canonical Intent list: https://devnode.telegraphprotocol.com/engine/v1/intents
- Intent request/response schema: https://anjoman.ai/docs/using/intent-schema
- Evaluation material and provenance: https://anjoman.ai/docs/scoring/contribute-evaluation-data
- Scoring module guide: https://anjoman.ai/docs/scoring/build-a-scoring-module
- Anjoman Evaluate: https://anjoman.ai/dashboard/eval
- Season II rules and scoring: https://anjoman.ai/dashboard/hackathon/season-2/rules
- Official submission: https://anjoman.ai/dashboard/hackathon

Re-check live pages before acting; official platform state and rules take precedence over this repository document.


---

## 14. Official evaluation-pool mechanics confirmed from current Anjoman documentation

This section records operational details from the current *Contribute Evaluation Data* documentation (updated 31 October 2026). These details are important to execution:

### Pool activation and contribution model
- Judgment questions are used only once an Intent's pool contains material from at least **five different contributors**. Samples draw evenly across contributors, so a single contributor cannot dominate the pool.
- Truth sources for deterministic intents have no five-contributor minimum; one valid truth source can be enough for an Intent to be scored.
- Each row is assigned by the node to either the testing half or ranking half. Contributors do not choose the half. Testing rows are hidden and used to compare scoring modules; ranking rows can be shown to miners.
- Therefore, a judgment-data plan must recruit independent contributors. Pawan's own rows alone cannot activate the judgment question pool.

### Official JSONL row format
The documented question-row shape is:
```json
{"prompt":"...","chosen":"...","rejected":"...","label_kind":"preference_pair","provenance":{"source_kind":"human","source_url":"https://..."}}
```
Supported `label_kind` values are `preference_pair`, `ground_truth`, and `graded_exemplar`; deterministic/hybrid truth sources use `label_kind: truth_source` with a separate `source` document and no prompt/answer fields. Veridex's internal schema must be converted to the exact current official schema; do not assume the local `pairs.jsonl` is upload-ready.

### Provenance semantics
- A row with an HTTP(S) `source_url` is recorded as `attested`.
- A row whose `source_kind` is `llm`, `synthetic`, `generated`, or `model` is always `unverified`, even if it has a URL.
- Other provenance combinations are unverified.
- The platform's `attested` classification is a provenance state, not proof that two independent reviewers agreed. Keep Veridex's human adjudication records separate.

### Upload, signature and row lifecycle
- Uploads use `POST /api/evalpool/submissions?intent_id=<INTENT>&submitter=<address>`, with an EIP-191 signature over the exact request-body hash, fresh nonce and node chain ID.
- The documented Sepolia testnet chain ID is `11155111`. Uploading changes the live evaluation pool.
- The documentation says there is no fee or bond for evaluation-data upload. A wallet signature is still an authorization and must be performed by the account holder; it is not part of this automated work.
- A successful HTTP 200 means the file was read, not that every row is eligible. New rows start in `quarantine`; after checks they may become `admitted`, and only rows in a frozen snapshot become `eligible`. Other states include `rejected`, `superseded`, and `revoked`.
- Check row-level state and the pool status after upload. Rows admitted after an epoch rollover are not immediately eligible in the current snapshot.

### Execution impact
1. P0 must establish whether the live route is judgment, hybrid or deterministic.
2. If judgment/hybrid: recruit at least five genuine contributors, create balanced human-reviewed question material, and verify row-level eligible state after an authorized upload.
3. If deterministic/hybrid: author a valid public, no-key truth-source document matching the exact live request schema and verify its row state.
4. Only build or train an adapter if the live scoring module actually requires it.
5. Never treat a successful upload response, `attested` provenance, `admitted` state or a local validator pass as equivalent to `eligible` or canonical scoring-module promotion.


---

## 15. Catalogue and live-node scope — a discrepancy must be resolved

The Season II shared Intent catalogue labels **`SMART_CONTRACT_AUDIT` as Hybrid**. A read-only live-node check on 16 November 2026 found the canonical child **`SMART_CONTRACT_AUDIT_GENERAL`**, with 18 miners, while the live scorer currently resolves to Judgment through the generic fallback. The live detail endpoint returns `request: null` and `response: null`. This contradicts the published Hybrid class and requires maintainer clarification.

Consequences:
1. Use `SMART_CONTRACT_AUDIT_GENERAL` as the current canonical **evaluation-pool Intent ID** because that is what the live registry returns. Treat `SMART_CONTRACT_AUDIT` as the published family/prefix label, not as a canonical child Intent for pool uploads.
2. The Season II catalogue says **Hybrid**, but the live scorer says **Judgment** via `served_by: GENERIC`, `generic_fallback: true`. Follow the live scorer for runtime truth, but do not build against this mismatch until maintainers confirm the intended path.
3. Do not train a judgment-only adapter based on the old bounty wording.
4. The live node remains the final authority. Verify `canonical: true`, `miner_count > 0`, exact `request.params`, `response.fields`, `class`, and the resolved scorer using the documented node endpoints before building or uploading anything.
5. The live Intent list endpoint was not readable through the available browser fetch during this reconciliation. Therefore the catalogue classification is confirmed as a published Season II reference, but live node routing, active miner supply and the exact request schema remain **unverified**.

**Updated P0 decision:** implementation remains blocked by the catalogue/node class mismatch, missing request/response schema, generic scorer fallback, and missing adapter-kit family entry. The canonical child pool has 2 eligible submitters (5 required). Obtain maintainer direction before building or uploading.


---

## 16. Corrected implementation target and exact hybrid data contract

The Season II catalogue labels the family `SMART_CONTRACT_AUDIT` as **Hybrid**. The live node identifies `SMART_CONTRACT_AUDIT_GENERAL` as the canonical child Intent. Therefore local evaluation-pool JSONL must use `intent_id: SMART_CONTRACT_AUDIT_GENERAL`; adapter registration family remains a separate prefix decision. The live node currently resolves both family and child to Judgment via the generic fallback, so the catalogue/node mismatch is a hard blocker.

For Hybrid scoring, there are two separate material types:

### Question material
- One JSON object per JSONL line; one Intent per upload.
- Supported labels: `preference_pair` (default), `ground_truth`, `graded_exemplar`.
- `preference_pair` requires non-empty `chosen` and `rejected`, which must differ.
- `ground_truth` and `graded_exemplar` require non-empty `chosen`; `rejected` is optional and, if present, must differ.
- The question pool requires at least five distinct eligible contributors before question rows are used. The node samples evenly across contributors.
- A public `source_url` marks platform provenance as `attested` only when the source kind is not generated/model. This is not an independent human-review certificate.

### Truth-source material
- A truth source uses `{"label_kind":"truth_source","source":...}`; it has no `prompt`, `chosen` or `rejected`.
- `source` is the miner YAML/JSON document, either as a JSON string or an object.
- The source must use a public, no-key HTTPS endpoint and declare `SMART_CONTRACT_AUDIT` (or wildcard) in its endpoint's `intents`.
- Truth sources have no five-contributor minimum; one valid source can be enough. It must match the exact live request/response schema and produce the value required by the Intent's comparator.
- The node's YAML loader and row checks are authoritative. The Veridex validator only performs local structural preflight.

### Live route and tooling blockers
The current public adapter kit at `telegraphprotocol/telegraph-wasm-baseline` HEAD still points to `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. Its compiled class catalogue contains neither `SMART_CONTRACT_AUDIT` nor `SMART_CONTRACT_AUDIT_GENERAL`. The adapter builder deliberately refuses unknown Intent classes. Do not add a local catalogue entry and treat that as network support. A maintainer-confirmed kit update or supported build path is required before adapter packaging.

A read-only live evidence script and GitHub Actions workflow have now been added:
- `npm run verify:audit-live`
- `scripts/verify-smart-contract-audit-live.mjs`
- `.github/workflows/smart-contract-audit-live.yml`

The workflow records the live Intent registry, canonical child miner endpoint, both family/child scorer resolutions and both evaluation-pool states. The first completed run found 18 child miners, no family-prefix miners, a generic Judgment fallback, no request/response schema, and only 2 eligible pool contributors. It is observational: no signatures, uploads, bonds, registrations or payments. The first run on the updated branch must be inspected before claiming live route confirmation.
