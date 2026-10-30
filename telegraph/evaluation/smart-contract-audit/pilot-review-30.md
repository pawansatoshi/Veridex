# SMART_CONTRACT_AUDIT — 30-case pilot review batch

Status: **review queue only**. This is not an attested evaluation dataset.

## Selection
- 30 SCVD candidate records total
- 10 reentrancy, 10 access-control, 10 arithmetic
- 24 distinct source repositories
- Deterministic round-robin selection across repositories within each category

## Files
- `pilot-review-30.jsonl`: candidate metadata plus blank human-review fields
- `pilot-review-30-manifest.json`: batch scope, selection method and limitations

## Required review for every case
1. Locate the original audit finding/report permalink. A repository root URL alone is insufficient evidence.
2. Resolve the affected source file and function at the pinned commit (or document why no commit is available).
3. Read the complete relevant code path and identify preconditions, caller permissions, state dependencies and external interactions.
4. Confirm whether the reported issue is valid, invalid, duplicate, out of scope, or unresolvable. Do not infer validity from taxonomy or source severity.
5. Record a reproducible test, proof, or precise source-level reasoning.
6. Record reviewer identity and UTC review time.

## Preference-pair gate
Do **not** fill `chosen` or `rejected` and do not mark `provenance_source_kind=human` until a qualified human reviewer has independently verified the case and authored the pair. This batch deliberately contains no generated answers or preference labels.

## Known source-quality gap
Some source records have no source file, report permalink, or pinned source commit. These are evidence-resolution tasks, not verified findings. Cases without adequate provenance must remain pending or be excluded.

## Next milestone
Complete and audit this pilot before expanding to the remaining 1,034 candidates. This step does not upload data to Telegraph, register an adapter, sign a wallet message, or claim a bounty.
