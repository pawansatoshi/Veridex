# Track 2 Release Command Center

## Mission

Ship one exact, reproducible `FRAUD_DETECTION` WASM candidate only after all protocol, quality, runtime, security and provenance gates pass.

## Current candidate

- Branch: `track2-v10-hardening`
- PR: `#203`
- Current source head: `ccac81b1398aeb65dadf27f795c5ce5c58f23be5`
- Baseline: `telegraphprotocol/telegraph-wasm-baseline`
- Baseline commit: `dfa0cf7fda72789267811ba2190f61a8eaacedf6`
- Fast path: 64-token cap + 5 executed transformer layers
- Registration: **NONE FOR CURRENT CANDIDATE**

## Gate state

| Gate | State | Proof required |
|---|---|---|
| Source/build | RUNNING | fresh Track-2 CI |
| Structural | PENDING | valid WASM, exports, 0 imports, <=32 MiB |
| Primary preflight | PENDING | 0 inversions, deterministic, hard-zero behavior |
| Primary tournament | PENDING | all high > low |
| Contract-security | PENDING | preflight + tournament green |
| Mutation | PENDING | 0 unacceptable failures |
| Public hard.json | PENDING | strict public checker pass |
| Public Wazero | PENDING | strict checker + runtime/memory pass |
| Hash/provenance | PENDING | exact SHA-256 + baseline/checker provenance |
| Artifact freeze | BLOCKED | requires all gates green |
| Telegraph registration | BLOCKED | requires frozen artifact |
| Live Stage 2 | BLOCKED | requires accepted registration |
| Hackathon submission | BLOCKED | requires exact accepted artifact/registration |

## Hard stop conditions

- any structural failure;
- any non-finite/out-of-range score;
- empty/whitespace answer != exactly 0;
- exact normalized match != exactly 1;
- any nondeterminism;
- any memory/ABI error;
- any unacceptable high-vs-low inversion;
- public checker failure;
- live time-budget failure;
- provenance ambiguity.

## Experiment discipline

Only one scoring hypothesis per candidate. Historical failed registrations are evidence only and are never mutated in place. Any binary change requires a new build, hash and registration.

## Final promotion sequence

`CI GREEN → exact artifact → SHA-256 → IPFS → fresh registration → pending → active/rejected → live Stage-2 metrics → exact submission`

## Honest status

A local or CI green result does not prove #1. Only Telegraph's independent live evaluation can establish competitive placement.
