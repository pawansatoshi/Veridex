# Track 2 upstream notice

## Veridex FRAUD_DETECTION calibration candidate

The competitive FRAUD_DETECTION calibration candidate is derived from the MIT-licensed `fr_ss2.wasm` artifact supplied for technical benchmarking against the live Track 2 leaderboard.

The transformation is original to this repository: it adds a fresh freestanding `rank_answer` wrapper with a strictly increasing two-band calibration map and redirects the `rank_answer` export to that wrapper. The upstream executable/data are not represented as original Veridex scoring research.

The upstream repository is `zkasuran/telegraph-salience-scorer` and its published README states that the modules are MIT licensed. The exact upstream byte identity, source URL, and registration provenance must be retained in the release record for reproducibility.

This notice is intentional. We do not present an upstream-derived calibration artifact as independently authored semantic-model research.

## Veridex relationship

The candidate is used for the `FRAUD_DETECTION` evaluation layer of Veridex Track 2. Track 1 remains Veridex's evidence-first Miner, and Track 3 consumes Veridex intelligence at the application layer.

## Release discipline

- Keep the upstream attribution and MIT license with any redistributed source or artifact where required.
- Record the exact upstream bytes/hash used to construct each candidate.
- Record the calibration threshold used for every fresh on-chain registration.
- Never mutate an already registered binary in place.
- Do not claim that the calibration derivative is original semantic-model research.
