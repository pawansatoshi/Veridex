# Pilot review findings — source metadata quality gate

**Status: preliminary metadata triage only. No case in the pilot is human-verified.**

The current 30-case shortlist contains 10 records per SCVD category and spans 24 source repositories. It is curated, not a random or statistically representative sample.

## Metadata coverage observed
- 30/30 records had a source URL.
- 27/30 had a source commit.
- 11/30 had a source-file field.
- 0/30 had a contract name or function name.
- 9/30 selected records contained 29 inline links in their finding summaries; the first fetcher did not preserve these links.
- The raw SCVD references array was empty in the first API snapshot.

The updated fetcher preserves the raw references array and extracts links embedded in the source summary, plus the SCVD document ID and finding index. The generated manifest reports the latest field coverage. These values still require human verification; a repository URL, commit, or source-summary link does not prove that a finding is valid or that the cited code is the audited version.

## Taxonomy/title mismatches requiring review
- A record classified as reentrancy is titled "Use named imports instead of importing the entire namespace" and has informational source severity.
- A record classified as access_control is titled "Token Transfer Gas Cost While Farming".
- A record classified as arithmetic is titled "SiloFacet::transferDeposits should only call LibSiloPermit::_spendDepositAllowance once".

These are not adjudicated false positives. They are evidence-resolution tasks. The taxonomy and title may be incomplete, mismapped, or insufficient to understand the issue.

## Gate before preference-pair construction
1. Resolve the original audit-report permalink and confirm it supports the finding.
2. Resolve and inspect the exact source file/function at the reported commit.
3. Independently assess exploitability, preconditions, impact, severity, and remediation.
4. Record a reproducible test or precise source-level rationale and reviewer provenance.
5. Obtain a second independent review and exclude unresolved cases.

Do not produce chosen/rejected answers, attest human provenance, or upload any dataset until this gate is met.