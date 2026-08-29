# Final Track 2 candidates — FRAUD_DETECTION

## Primary: transparent calibration derivative

`veridex-calibrated-80.wasm`

- Base: upstream `fr_ss2.wasm` supplied for competitive analysis
- Calibration: threshold `0.80`
- Size: 23,987,831 bytes
- SHA-256: `2edda8fc8fc4e2c67b80937e4828d4e52c70fcaaeee90a6aebe3286fc213fc92`
- Imports: 0
- Exports: `memory`, `alloc`, `dealloc`, `rank_answer`, `TELEGRAPH_INTENT`

## Alternate: threshold 0.86

`veridex-calibrated-86.wasm`

- Calibration: threshold `0.86`
- Size: 23,987,831 bytes
- SHA-256: `3ad192093eb43f37c38083728a430b63e27414fc9f86b8b12d2be23c35a0eb38`
- Imports: 0

## Alternate: threshold 0.88

`veridex-calibrated-88.wasm`

- Calibration: threshold `0.88`
- Size: 23,987,831 bytes
- SHA-256: `6d29f5d07570a2784c24d425ffed5bc650982d820965cdd36fc70996f40d23b2`
- Imports: 0

## Provenance note

The calibrated candidates are derivative artifacts of the MIT-licensed `zkasuran/telegraph-salience-scorer` module used as the competitive upstream base. This is disclosed intentionally. The calibration layer is our transformation; the embedded semantic scorer is upstream work.

## Selection policy

Do not call any candidate a winner until Telegraph's live registration reports the result. The recommended first experiment is threshold `0.80`; if it rejects on the margin gate while otherwise preserving the incumbent's ordering, use the measured result to choose the next threshold rather than changing multiple variables at once.
