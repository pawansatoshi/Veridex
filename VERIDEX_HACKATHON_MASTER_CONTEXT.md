# VERIDEX HACKATHON — MASTER CONTEXT

> Continuity document for future agents/contributors. Read this before changing Track 1, Track 2, Track 3, deployment, or hackathon submission artifacts.

## 1. PROJECT MISSION

Veridex is an evidence-first smart-contract capability intelligence product. The core thesis is:

**No Evidence → No Certainty.**

Veridex should explain what a contract can do, who can exercise a capability, what evidence supports the conclusion, and how confident the system should be.

The hackathon implementation must remain one coherent Veridex product across all three tracks, not three unrelated demos.

## 2. THREE-TRACK ARCHITECTURE

### Track 1 — Miner
Produces useful, evidence-backed intelligence about smart contracts/capabilities. Focus: capability discovery, authority, upgradeability, evidence and confidence.

### Track 2 — Script Author / Evaluator
Scores Miner answers deterministically and ranks better answers above weaker/contradictory answers. The evaluator should reward factual/semantic correctness, not merely keyword overlap.

### Track 3 — Application
Consumes Telegraph intelligence in a real Veridex workflow/product. The application should turn Miner intelligence into useful user-facing contract analysis, passport/history/monitoring or agent workflows.

**Shared thesis:** Track 1 produces evidence → Track 2 measures answer quality → Track 3 turns intelligence into product value.

## 3. TRACK 2 OBJECTIVE

Target is not merely “passes the public checker.” The competitive target is:

- all structural/hard gates pass
- deterministic behavior
- zero invalid scores
- empty/whitespace answer returns exactly 0
- exact/self match is strong
- robust Unicode/long-input behavior
- no WASI/network/filesystem dependency
- strong ordinal ordering
- beat the current incumbent/champion on the hidden evaluation where possible
- maximize candidate wins and margin without sacrificing rank quality

No one can guarantee #1 because Telegraph's final benchmark is independent/partly hidden. Never claim victory before live registration/evaluation confirms it.

## 4. HISTORICAL FAILURES — DO NOT REPEAT

- #1809: structural validation failed because whitespace-only answer returned 0.0097 instead of exactly 0.
- #1818: reached behavioral evaluation but lost to incumbent on ordering, 14/15.
- #1821: again lost to incumbent on ordering, 14/15.

These are regression lessons. Do not blindly re-register old binaries.

## 5. CURRENT TRACK 2 DIRECTION

The early Veridex scorer was a compact rule/lexical scorer. It used lexical overlap and small semantic/contradiction/numeric/entity rules. This was insufficient against a much larger semantic incumbent.

The current strategy is a **semantic + factual + contradiction + ordinal calibration** architecture:

1. Normalize input safely.
2. Exact/normalized match.
3. Lexical precision/recall and phrase evidence.
4. Conservative semantic equivalence classes.
5. Morphology/common inflections.
6. Contradiction, negation, polarity and direction checks.
7. Numeric equivalence and numeric mismatch penalties.
8. Entity preservation/conflict protection.
9. Question-context/answer-type relevance where safe.
10. Produce a bounded deterministic base score.
11. Apply a strictly monotonic calibration only when it improves separation while preserving ordering.

The scorer must remain standalone, deterministic, and compatible with Telegraph's WASM runtime.

## 6. IMPORTANT COMPETITOR LESSON

Top observed FRAUD_DETECTION incumbents were around 24 MB, while early Veridex rule scorers were only KB-scale. Binary size itself is not the objective; the top family contained a large static semantic representation with a relatively small executable code section.

Research also showed that monotonic score calibration can materially improve good-vs-bad margin without changing pairwise ordering/rank correlation. This is a strategy insight, not permission to copy or conceal another team's work.

### Provenance rule

Do not present competitor-derived binaries, code, weights, or data as original Veridex work. Before using any external artifact, inspect its license/provenance and document permitted reuse/attribution. Prefer independently implemented Veridex logic. If an upstream semantic base is used under a compatible license, preserve required notices.

## 7. BENCHMARK STRATEGY

The internal Track 2 benchmark should be broader than the public probes and should be designed for generalization:

- exact matches
- normalized matches
- paraphrases
- conservative synonyms
- partial/correct-core answers
- unrelated answers
- wrong entity
- wrong number/unit
- wrong date
- polarity reversal
- negation
- direction reversal
- surface-overlap traps
- evidence/capability terminology
- security/fraud terminology

The current benchmark is `telegraph/evaluation/track2-benchmark-v2.json` with 50 cases.

Important: do not trust a benchmark unless the incumbent also performs well on it. A benchmark that is anti-correlated with live incumbent behavior is not useful for optimization.

## 8. DIAGNOSTIC / TOURNAMENT REQUIREMENT

Every candidate should be evaluated locally before registration.

Required metrics:

- number of high-vs-low pairs
- inversions
- mean margin
- worst margin
- self-match
- score standard deviation
- deterministic repeatability
- invalid-score count

When an ordering inversion occurs, report:

Question / ground truth / high answer / low answer / both scores / component scores / likely reason high lost.

Do not tune weights blindly.

## 9. PRE-REGISTRATION GATE

Before spending another registration:

- required exports: `memory`, `alloc`, `dealloc`, `rank_answer`, `breakdown_answer`
- `""` answer → exactly 0
- whitespace-only → exactly 0
- empty ground truth → 0
- scores finite and within [0,1]
- deterministic repeated and fresh-instance behavior
- long input safe
- UTF-8/CJK/emoji/accented input safe
- embedded NUL safe
- no WASI/network/filesystem dependency
- WASM under Telegraph size limit
- official/public Wazero checker passes where available
- internal benchmark has zero high-vs-low inversions

**No green gate → no registration.**

## 10. REGISTRATION / SUBMISSION POLICY

Telegraph registration binds the exact binary/hash. A changed binary requires a fresh registration ID. Never assume a rejected registration can be repaired in place.

Correct sequence:

**build → local gate → official checker → hash → register → wait for status → inspect result → only then submit Hackathon form using the exact accepted registration/artifact.**

Do not submit the Hackathon Track 2 form merely because a registration is `pending`.

## 11. CURRENT ARTIFACT MAP

Important files under `telegraph/evaluation/` include:

- `BUILD.md` — build contract, required exports, scoring protections, benchmark and registration policy.
- `TRACK2_RELEASE_BLUEPRINT.md` — release/competition strategy.
- `track2-benchmark-v2.json` — 50-case benchmark.
- `track2-tournament.js` — pairwise tournament and runtime checks.
- `veridex_evaluator_v7.c` — previous ground-truth anchored scorer.
- `veridex_evaluator_v6.c` — earlier scorer retained for history/reference.
- `calibration/build_step_calibration.py` — reproducible calibration builder.
- `UPSTREAM_NOTICE.md` — provenance/licensing notice for any permitted upstream-derived material.

When a newer candidate is created, update this document with its exact source path, binary path/hash, validation result, registration ID/status and decision.

## 12. CURRENT STATUS — 2026-08-30

Track 2 has had several rejected registrations and has not yet been proven #1. The latest known failures (#1818 and #1821) were 14/15 ordering failures against the incumbent.

A larger semantic/calibrated candidate path was prepared for investigation, but **do not describe it as officially winning until Telegraph accepts/evaluates it**.

The current repo contains the v7-oriented documentation/benchmark infrastructure; the next agent must inspect the actual latest commit/files before assuming a v8/v9 binary exists or is production-ready.

## 13. NEXT WORK — PRIORITY ORDER

1. Inspect current repo state and latest commit before modifying anything.
2. Verify provenance/licensing of any semantic upstream base.
3. Complete the independent Veridex evaluator architecture rather than blindly copying competitor binaries.
4. Make question-context scoring actually affect the score where safe.
5. Expand diagnostics so every inversion is explainable.
6. Validate benchmark quality against incumbent behavior.
7. Run public/Wazero checker plus internal tournament.
8. Produce one final reproducible WASM and record SHA-256.
9. Register only after all gates are green.
10. Wait for accepted/active status.
11. Compare live result to incumbent.
12. Submit Track 2 only with the exact accepted candidate.
13. Preserve the same Veridex evidence-first thesis across Track 1 and Track 3.

## 14. DO NOT DO

- Do not repeatedly register unverified binaries.
- Do not claim a local pass means a hidden-benchmark win.
- Do not optimize only for public fixtures.
- Do not copy competitor work and hide provenance.
- Do not sacrifice determinism for semantic sophistication.
- Do not make Track 2 unrelated to Veridex.
- Do not modify a binary after its registration hash is submitted.

## 15. HANDOFF RULE

A new agent should read this file first, then `telegraph/evaluation/BUILD.md`, `TRACK2_RELEASE_BLUEPRINT.md`, the current scorer source, benchmark, tournament, CI workflow and latest commit history.

Before telling the user “done,” verify the actual files and, where relevant, the live Telegraph registration status. Distinguish clearly between:

**implemented locally / validated locally / accepted by Telegraph / competitive on hidden benchmark / officially submitted.**
