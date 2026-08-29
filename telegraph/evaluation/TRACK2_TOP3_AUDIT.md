# Track 2 competitive audit — FRAUD_DETECTION

## Observed leaderboard snapshot

From the Explorer snapshot supplied during development, the visible leaders were:

- #1755 — 0.879 — champion
- #1756 — 0.877
- #1750 — 0.877
- #1733 — 0.874
- #997 — 0.872
- #982 — 0.797
- #63 — 0.789

The target is therefore not merely to pass registration; it is to beat the incumbent's ordering quality and margin under the protocol's Stage 2 benchmark.

## Binary-size analysis

The three supplied leaderboard binaries were measured directly:

| Artifact | Bytes | Approx. size | Memory minimum | Code section | Data section |
| --- | ---: | ---: | ---: | ---: | ---: |
| fr_ss2.wasm | 23,987,775 | 22.88 MiB | 30 MiB | 31,317 B | 23,956,199 B |
| fr_ss3.wasm | 23,987,833 | 22.88 MiB | 30 MiB | 31,374 B | 23,956,199 B |
| fr_e9.wasm | 23,987,717 | 22.88 MiB | 30 MiB | 31,260 B | 23,956,199 B |

All three supplied binaries have the same two data segments, including a 23,698,117-byte segment beginning at linear-memory offset 1,048,576, and the same 258,060-byte second segment. Their code sections are only ~31 KB and their export surfaces are `memory`, `alloc`, `dealloc`, `rank_answer`, and `TELEGRAPH_INTENT`.

This strongly indicates a shared embedded representation/artifact rather than simple source-code bloat. The exact model/table semantics cannot be proven from the binary alone, so this document deliberately describes it as an embedded representation rather than naming a specific model.

## Why size matters here

Size itself does not earn leaderboard points. The useful signal is that the leaders spend ~24 MB on static data while Veridex's rule-based candidate is only ~16 KB. A tiny deterministic scorer has excellent portability and predictable behavior, but it has much less representational capacity for semantic paraphrase, long-tail wording, and subtle answer distinctions.

The supplied leaders also share the same static data while differing slightly in code and final score calibration. That is consistent with a common semantic/feature backbone plus variant ranking/calibration logic, although the exact implementation cannot be recovered with certainty from these artifacts alone.

## Why the previous Veridex candidates lost

The on-chain failures establish three distinct classes of problems:

1. malformed/invalid WASM in an early candidate;
2. a whitespace-only answer that did not return exactly zero;
3. later candidates reached Stage 2 but lost one benchmark ordering comparison: Veridex 14/15 versus the incumbent 15/15.

The key technical weakness was not WASM validity after the fixes. The earlier scorer was primarily lexical overlap with small semantic groups and initially ignored the question for actual scoring. That can rank a fluent but contradictory answer above a semantically correct paraphrase.

## Competitive response

The v7 candidate now adds:

- morphology-aware token comparison;
- conservative closed-set semantic classes;
- explicit opposite-group contradiction checks;
- direction-flip protection;
- numeric equivalence including comma/underscore formatting and common unit words;
- wrong-entity protection using ground-truth and question context;
- limited question-token relevance;
- character n-gram similarity as a lightweight paraphrase signal;
- deterministic bounded scoring with no network, filesystem, clock, randomness or external model.

A 50-case internal benchmark has been added to the repository, and the local tournament currently produces zero high-vs-low ordering inversions on its 56 pairwise comparisons. This is an internal regression result, not a claim about Telegraph's hidden benchmark.

## Operational rule

No candidate should be registered solely because it compiles or passes a few examples. The release gate is:

`compile -> structural validation -> zero imports -> official Wazero checker -> 50-case tournament -> deterministic/edge probes -> fresh registration -> wait for active status -> observe Stage 2 result -> submit Track 2`

A hidden Stage 2 win cannot be guaranteed in advance because the final benchmark is independent. The objective is to improve genuine ordinal ranking quality and reduce known failure modes without overfitting to published probes.
