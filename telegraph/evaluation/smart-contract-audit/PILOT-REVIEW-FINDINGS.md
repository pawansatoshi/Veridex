# Pilot review findings — source metadata quality gate

**Status: preliminary triage only. No case in the pilot is human-verified.**

The stratified 30-case sample (10 per SCVD category) shows that the source taxonomy must not be treated as ground truth.

Examples flagged for manual inspection:
- A record classified as `reentrancy` has the title "Use named imports instead of importing the entire namespace" and an informational source severity.
- A record classified as `access_control` has the title "Token Transfer Gas Cost While Farming".
- A record classified as `arithmetic` has the title "SiloFacet::transferDeposits should only call LibSiloPermit::_spendDepositAllowance once".

These examples are **not adjudicated false positives**. They are metadata/title mismatches requiring report-level review. The pilot also contains records with missing source commits, missing source files, or only repository-root source URLs.

## Gate before preference-pair construction
1. Resolve the original audit-report permalink.
2. Resolve the exact source file and function at the reported commit.
3. Independently inspect the code path and impact.
4. Mark each candidate valid, invalid, duplicate, out-of-scope, or unresolvable, with rationale and reviewer identity.
5. Exclude unresolved or inadequately sourced cases.

Do not produce `chosen`/`rejected` answers, attest human provenance, or upload any dataset until this gate is met.
