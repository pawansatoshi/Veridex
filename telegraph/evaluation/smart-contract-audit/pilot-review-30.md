# SMART_CONTRACT_AUDIT — 30-case pilot review batch

Status: **metadata review queue only**. This is not an attested evaluation dataset and no candidate has been independently verified by this workflow.

## Selection
- 30 SCVD candidate records matched against the fetched 1,064-record source queue
- 10 records per SCVD category: reentrancy, access control, and arithmetic
- 24 distinct source repositories in the current selection
- This is a curated stratified shortlist encoded in the committed CSV, not a random or statistically representative sample

## Files
- pilot-review-30.csv: committed selection index (case ID, category, title, pending status)
- source-candidates/pilot-review-30.jsonl: generated full metadata packet, including blank review fields and preserved SCVD references
- source-candidates/pilot-review-30-manifest.json: generated source counts, selection method, and metadata-field coverage
- Both generated files are included in the smart-contract-audit-human-review-queue GitHub Actions artifact; artifacts expire after 14 days

## Required review for every case
1. Locate and verify the original audit finding/report permalink; a repository root URL is not enough.
2. Resolve the affected source file and function at the pinned commit, and verify the path exists.
3. Read the relevant code path and identify exploit preconditions, caller permissions, state dependencies, external interactions, and impact.
4. Classify the candidate as valid, invalid, duplicate, out of scope, or unresolvable, with a precise rationale.
5. Record a reproducible test, proof, or source-level reasoning, plus reviewer identity and UTC review time.
6. Obtain an independent second review before using the case in preference data.

## Preference-pair gate
Do **not** fill chosen or rejected and do not mark provenance_source_kind=human until a qualified human reviewer has independently verified the finding and authored the preference judgment. A public URL or SCVD taxonomy label alone is not human attestation.

## Known source-quality gap
The first source artifact showed that only 27/30 selected records had a source commit and 11/30 had a source-file field; none had a populated contract name or function name. The earlier fetcher did not preserve the SCVD references array. The updated fetcher now preserves those references, and the next workflow artifact will report their coverage. A source commit or file field is metadata, not proof that the linked code is the audited code.

## Next milestone
Resolve the primary report and exact source location for all 30 cases, then complete independent human adjudication. Exclude unresolved or inadequately sourced records. This workflow does not create preference labels, upload data to Telegraph, register an adapter, sign a wallet message, or claim a bounty.
