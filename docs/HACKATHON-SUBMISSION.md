# Veridex — Hackathon Submission Package

## Telegraph Miner registration

- Miner ID: `1001`
- Slug: `veridex-contract-risk-miner`
- Historical superseded registration: `122` — `FRAUD_DETECTION`
- Historical superseded registration: `142` — `CONTENT_VERIFICATION`
- Current registration: `144` — `FRAUD_DETECTION`
- Registration network: Base Sepolia
- Current registration transaction: `0xe9df234aaf7c9f7501e9971f01705e52172b81bd4a2fd96932b22d5bc4b7ce6a`
- Primary production endpoint: `https://veridex-ecru.vercel.app`
- Endpoint: `POST /analyze`
- Repository Miner intent: `FRAUD_DETECTION`

The current Telegraph registration flow reported registration ID `144` successfully on Base Sepolia. The transaction is confirmed successful on Base Sepolia. The registry UI may require indexing time before the new entry appears as the active indexed configuration.

Final H1 GREEN still requires the current commit's blocking GitHub Actions gates to pass, including live Telegraph registry verification. Do not claim final registry alignment until the live registry check independently confirms registration `144` and the expected `FRAUD_DETECTION` intent.

## Track coverage

### Track 1 — Miner

**Primary submission.** Veridex exposes deterministic, evidence-backed contract capability intelligence through the live Miner API.

Core capabilities:

- ownership/control
- upgradeability/proxy surface
- pause capability/state
- mint capability/authority where evidence permits
- evidence provenance and confidence
- conclusive/inconclusive/unavailable state
- resilience and bounded parsing
- Capability Passport
- Continuous Watch

### Track 2 — Evaluation / quality script

Veridex includes `npm run evaluate:miner` and `scripts/evaluate-miner.mjs`.

The evaluator consumes the real-chain ground-truth report and deterministically scores:

- correctness/accuracy
- evidence coverage
- conclusive rate
- false positives
- false negatives
- provider/error/unavailable outcomes

The score is explicitly an internal quality gate and is **not** represented as Telegraph's official ranking.

### Track 3 — Application / agent consumption

The evidence-first web application in `index.html` is the consumer surface. It accepts an address, calls the live Miner, and presents capability intelligence, evidence and confidence without fabricating unsupported conclusions.

See `docs/TRACK-3-APPLICATION.md` for the production contract and demo flow.

## Final verification command sequence

```text
BUILD → AUDIT → TEST → DEPLOY → VERIFY → FIX → REBUILD → REVERIFY → CI → GREEN
```

Local gates:

```bash
npm install --no-audit --no-fund
npm run typecheck
npm run build:core
npm test
npm run verify:real-chain
npm run evaluate:miner
npm run benchmark:miner
npm run verify:production-schema
```

The GitHub Actions workflow is authoritative for the final blocking gate and also verifies live deployment, Telegraph integration, real-chain correctness, performance, production schema, Phase 03 passport, Phase 04 watch, and Miner evaluation.

## Evidence policy

Never claim:

- official Telegraph ranking
- fabricated traffic or demand
- unsupported Intent mapping
- fake Track 3 usage
- green CI without a successful current-commit run
- live registry alignment before registration `144` is independently verified

Submission claims must be backed by reproducible artifacts or live endpoints.
