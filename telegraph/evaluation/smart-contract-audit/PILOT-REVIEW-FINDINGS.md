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

## Assistant source spot-checks — preliminary, not human attestation

- **AI Arena reentrancy candidate:** At the pinned source commit, MergingPool.claimRewards caches lowerBound, updates numRoundsClaimed inside the loop, and calls mintFromMergingPool. FighterFarm.mintFromMergingPool reaches _createNewFighter, which invokes _safeMint. This source path is consistent with the reported callback/reentrancy mechanism and is a strong candidate for an independent reviewer to reproduce. Sources: https://github.com/code-423n4/2024-02-ai-arena/blob/cd1a0e6d1b40168657d1aaee8223dc050e15f8cc/src/MergingPool.sol and https://github.com/code-423n4/2024-02-ai-arena/blob/cd1a0e6d1b40168657d1aaee8223dc050e15f8cc/src/FighterFarm.sol#L313-L317
- **Beanstalk arithmetic-category candidate:** At the pinned source commit, SiloFacet.transferDeposits loops through amounts and calls _spendDepositAllowance for each amount. The supplied summary frames this as reducing repeated storage operations, not as an arithmetic vulnerability. Source: https://github.com/BeanstalkFarms/Beanstalk/blob/dfb418d185cd93eef08168ccaffe9de86bc1f062/protocol/contracts/beanstalk/silo/SiloFacet/SiloFacet.sol#L174-L192
- **Dropbox reentrancy-category candidate:** The supplied finding summary recommends named imports and is marked Informational; the summary does not describe a reentrancy exploit. Its category assignment requires source/report review and should not be accepted as a vulnerability label.

These are source-level triage observations from the public commit-pinned files. They are not a completed human review, exploit reproduction, or final valid/invalid adjudication. Keep all three records pending until an independent reviewer confirms the original report and impact.



## Additional source trace — AI Arena H-08 (4 November 2026)

Candidate: `SCVD-github:code-423n4/2024-02-ai-arena-findings-1643` (SCVD finding index 1643; category `reentrancy`; source commit `cd1a0e6d1b40168657d1aaee8223dc050e15f8cc`).

The original Code4rena AI Arena report resolves this candidate to **H-08**, titled “Player can mint more fighter NFTs during claim of rewards by leveraging reentrancy on the claimRewards() function” (High severity). The report describes `MergingPool.claimRewards()` calling `FighterFarm.mintFromMergingPool()`, which reaches `_safeMint`; a contract receiver can re-enter from `onERC721Received` while the outer claim loop is still active. The report includes a proof-of-concept attack contract and test path. The report's appended mitigation review lists H-08 as **Mitigation Confirmed**, with mitigation PR #6. Therefore this is a historically reported and subsequently confirmed-mitigated issue, not evidence that the pinned historical code or a current deployment remains exploitable.

Source trail:
- Original report: https://code4rena.com/reports/2024-02-ai-arena#h-08-player-can-mint-more-fighter-nfts-during-claim-of-rewards-by-leveraging-reentrancy-on-the-claimrewards-function
- Pinned `MergingPool.sol`: https://github.com/code-423n4/2024-02-ai-arena/blob/cd1a0e6d1b40168657d1aaee8223dc050e15f8cc/src/MergingPool.sol
- Pinned `FighterFarm.sol`: https://github.com/code-423n4/2024-02-ai-arena/blob/cd1a0e6d1b40168657d1aaee8223dc050e15f8cc/src/FighterFarm.sol
- Mitigation review table: https://code4rena.com/reports/2024-02-ai-arena#mitigation-review

The SCVD row remains `needs_independent_human_review`. This trace resolves the original report and historical mitigation status, but no reviewer identity, review timestamp, final valid/invalid adjudication, prompt, chosen/rejected pair, or human-provenance attestation has been written. An independent reviewer must still reproduce or inspect the PoC and compare the vulnerable commit with the mitigation before authoring any evaluation pair.
