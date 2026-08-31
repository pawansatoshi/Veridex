# Track 2 Candidate Promotion Matrix

This matrix is a release-control document. A candidate is promoted only after the current source and exact binary have been independently validated. Repository presence is not validation.

| Candidate | Architecture | Structural | Edge/ABI | Determinism | Primary ordering | Contract ordering | Adversarial | Public Wazero | Live Telegraph | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| V6 | Compact deterministic scorer | historical | historical | historical | obsolete | obsolete | legacy | historical | not reused | RETAIN FOR REGRESSION |
| V7 | Compact deterministic scorer | historical | historical | historical | insufficient vs incumbent | not applicable | legacy | historical | 14/15-era line | RETAIN FOR REGRESSION |
| V9 compact | Independent rule/lexical scorer | source path | **REJECTED** for unsafe >65,535-byte offset assumptions and breakdown-path issues | deterministic by design | not the current competitive line | not current | limited | not current | not reused | FALLBACK ONLY |
| V10 neural hybrid / run #93 | Pinned MIT baseline + Veridex wrapper | PASS | PASS | PASS | PASS in CI | PASS | PASS (157/157) | CI path reached checker | **REG #2084 rejected at 10m40s** | DO NOT REUSE |
| Fast V10.1 / run #124 | 64-token + 5-layer neural path | PASS (24,194,340 B, 0 imports) | PASS | PASS on reached gates | **FAIL: 3/55 inversions** | not reached | not reached in that run | not reached | not registered | REJECT |
| Current V10 hardening / `a8cb31f...` | 64-token + 5-layer neural + context-aware equivalence + factual guards | **CI PENDING** | pending | pending | pending revalidation | pending | pending | pending | not registered | CURRENT EXPERIMENT |

## Exact current experiment

Branch: `track2-v10-hardening`

Current source commit: `a8cb31fcd10c79a1841bd785bc75a9d5795c410b`

Current Track 2 workflow run: **#132** (pending at the time this matrix was updated).

### Hypothesis

The latest fix removes the faulty dependency on `vr_question_requires_number()` for explicit equivalence and preserves factual guards instead of returning early. The candidate now treats a question as numeric-contextual when it contains factual quantity/value terms and only applies equivalence handling when the ground truth contains a numeric fact and the answer explicitly asserts equivalence without an extracted conflicting number, opposite predicate, or entity conflict.

### Expected result

1. The three previously observed equivalence inversions become non-inversions.
2. Empty/whitespace/exact-match behavior remains unchanged.
3. The contradiction/entity/numeric mismatch guards remain active.
4. Structural size/import invariants remain unchanged.
5. Later public Wazero and mutation gates are reached.

## Historical regression evidence

Keep these as permanent release evidence:

- #1766 — self-match/cross-match failure.
- #1772 — insufficient separation.
- #1792 — malformed WASM.
- #1809 — whitespace-only answer returned non-zero.
- #1818 — 14/15 ordering vs incumbent.
- #1821 — 14/15 ordering vs incumbent.
- #2084 — live Telegraph time-budget rejection (10m40s including module load).

Never mutate or reuse these historical registrations for changed bytes.

## Promotion state machine

`UNVERIFIED → BUILD GREEN → STRUCTURAL GREEN → PRIMARY GREEN → SECURITY GREEN → MUTATION GREEN → PUBLIC WAZERO GREEN → HASH FROZEN → FRESH REGISTRATION → ACCEPTED → LIVE COMPETITIVE EVIDENCE → SUBMISSION`

A candidate cannot skip a state.

## Decision rule

**No green gate → no registration.**

Local `0` inversions is necessary but not sufficient for a hidden Stage 2 win. A live Telegraph result is the only evidence that can establish actual competitive placement.
