# Independent review and contributor onboarding

Veridex is preparing a SMART_CONTRACT_AUDIT Evaluator contribution for Telegraph Season II Mission #202.

## Why help is needed

The live evaluation pool for the canonical Intent `SMART_CONTRACT_AUDIT_GENERAL` currently reports:
- 302 eligible rows;
- 3 total submitters, 2 eligible submitters;
- 5 distinct eligible contributors required before question material is used.

Three additional eligible contributors are therefore needed. Separately, Veridex's 30-case SCVD pilot is a metadata-only queue and every case still needs independent human review.

## Review scope

Reviewers can help with one or more of:
1. Reentrancy: callback paths, state ordering, cross-function and cross-contract reachability.
2. Access control: role/owner acquisition, initializer protection, proxy upgrade authority and privileged call paths.
3. Arithmetic: compiler semantics, unchecked operations, casts, precision, rounding and reachable bounds.
4. Historical mitigation: compare the vulnerable commit with the fix and classify the finding as historical/mitigated rather than currently exploitable.
5. False-positive controls: inspect suspicious patterns that are not vulnerabilities in the supplied context.

## Review protocol

- Work from the original audit report and immutable source commit.
- Record exact repository, commit SHA, file, contract and function.
- State attacker preconditions, reachable call sequence, impact and remediation.
- Mark unresolved or conflicting evidence as incomplete/ambiguous.
- Have a second reviewer independently repeat the assessment before any case is promoted to gold data.
- Do not create synthetic reviewer identities, timestamps or human provenance.
- Do not publish protected evaluation samples or confidential exploit details.

## How to contribute

Open an issue or pull request in this repository with:
- the case ID(s) you reviewed;
- public source/report links and pinned commit;
- your independent verdict and rationale;
- whether you can perform a second independent review;
- whether you intend to contribute official evaluation material under your own signer address.

Do not post private keys, seed phrases or signatures. Each contributor must control their own wallet and independently authorize any official evaluation-pool upload.

## Protocol clarification needed

The Season II catalogue labels `SMART_CONTRACT_AUDIT` Hybrid, but the live node currently resolves `SMART_CONTRACT_AUDIT_GENERAL` to Judgment via the generic fallback and returns no request/response schema. The adapter kit also lacks the target in its compiled class catalogue. Do not author a truth source or train/register an adapter until maintainers confirm the intended route.
