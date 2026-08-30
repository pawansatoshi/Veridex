# Track 2 Candidate Promotion Matrix

This matrix is a release-control document. A candidate is promoted only after the current source and exact binary have been independently validated. Repository presence is not validation.

| Candidate | Structural | Edge/ABI | Determinism | Benchmark/Tournament | Breakdown | Size | Provenance | Decision |
|---|---|---|---|---|---|---|---|---|
| V6 | historical | historical | historical | lost/obsolete | legacy | small | Veridex | RETAIN FOR REGRESSION |
| V7 | historical | historical | historical | insufficient against incumbent | incomplete diagnostics | small | Veridex | RETAIN FOR REGRESSION |
| V9 | source only | **REJECTED**: `breakdown_answer` returned `0`; token offsets use `uint16_t`, unsafe for >65,535-byte inputs | source-deterministic by inspection | not a release proof | **FAIL** | small | Veridex | DO NOT PROMOTE |
| Neural hybrid pinned baseline | source/build path | pending fresh CI build | pending fresh build | pending fresh tournament | **FIXED IN V10** | expected <32 MiB, must verify | MIT upstream + disclosed Veridex wrapper | CURRENT CANDIDATE |
| V10 neural-hardening | branch implementation | pending CI | pending CI | pending CI | authoritative final slot added | pending CI | pinned MIT baseline + Veridex wrapper | **PROMOTE ONLY IF ALL GREEN** |

## Promotion rules

1. No candidate is registered solely because it compiles.
2. `rank_answer` and `breakdown_answer[4]` must agree within the release tolerance.
3. Empty and whitespace answers must return exactly `0`.
4. A candidate must survive inputs above 65,535 bytes; compact C candidates using 16-bit offsets are not acceptable.
5. Zero WASM imports and valid WASM validation are mandatory.
6. High-vs-low ordering is the primary local competitive gate; score magnitude alone is not.
7. The pinned Telegraph baseline is reused under MIT with explicit provenance. The Veridex wrapper is independently authored; upstream material is not represented as original work.
8. A candidate remains `UNVERIFIED` until CI produces a fresh exact binary, validation report and SHA-256.
9. Registration is forbidden until every required gate is green.

## Current decision

**V10 is the active engineering candidate. It is not yet an accepted Telegraph candidate and is not claimed to be #1.**
