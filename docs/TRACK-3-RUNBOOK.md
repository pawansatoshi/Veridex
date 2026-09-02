# Track 3 — Production Release & Troubleshooting Runbook

## Release goal

Ship the Veridex Track 3 application as a real production consumer of live Telegraph intelligence, with a bounded server-side payment path, explicit provenance, safe failure semantics and reproducible CI evidence.

## Required production configuration

Set these in the Vercel **Production** environment only:

```text
TELEGRAPH_ENGINE_URL=<verified externally reachable Telegraph Engine base URL>
TELEGRAPH_EVM_PRIVATE_KEY=<burner EVM private key>
TELEGRAPH_MAX_PAYMENT_USDC=0.05
TELEGRAPH_ALLOWED_NETWORKS=eip155:84532,base-sepolia
TELEGRAPH_TIMEOUT_MS=20000
TRACK3_MAX_REQUESTS_PER_IP=8
VERIDEX_APP_ORIGIN=https://veridex-ecru.vercel.app
```

Do not put the private key in Git, `package.json`, HTML, browser JavaScript, Vercel source, screenshots or CI logs. Use a burner wallet funded only for the intended testnet inference budget.

The current Telegraph docs describe x402 on Engine `/v1/ask`; they also distinguish the public node API on port `7044` from the internal Engine subprocess on port `8080`. Therefore `TELEGRAPH_ENGINE_URL` must be verified against the currently reachable deployment rather than copied blindly from an internal-node example. citeturn618968search0turn618968search1turn618968search2

## x402 safety model

The Track 3 server first makes the request without payment. If Telegraph returns `402`, Veridex:

1. decodes the payment requirement;
2. rejects disallowed networks;
3. rejects amounts above the configured cap;
4. signs/retries through the official x402 client with the server-side burner key;
5. records non-secret payment metadata and any returned settlement proof.

This mirrors the documented x402 pattern of `402 → payment authorization → retry → result`. citeturn618968search1turn618968search2

## Deployment checklist

### Code

- Track 3 API is `POST /track3`.
- Track 3 UI is `/telegraph/application/`.
- Track 2 WASM is not imported by Track 3.
- No frontend code imports the payment key.
- No mock response is embedded as a production result.
- Telegraph output is parsed through a bounded structured schema.
- Provider failure cannot create a negative finding.
- Conflicts remain visible.

### CI

Require green results for:

- npm audit
- typecheck
- build
- full unit test suite
- Track 3 regression suite
- proxy/passport/watch regression suites
- live Miner health
- current Telegraph YAML validation
- live Telegraph integration verification
- resilience recovery
- real-chain ground truth
- deterministic quality gate
- production benchmark
- production response schema

### Deployment

1. Push to `main`.
2. Wait for GitHub Actions and Vercel deployment.
3. Confirm the production deployment is `READY`.
4. Confirm `https://veridex-ecru.vercel.app/telegraph/application/` serves the new UI.
5. Confirm Vercel runtime logs show no Track 3 exceptions.
6. Run one real smoke test with a known contract.
7. If x402 is required, verify payment metadata and settlement transaction without exposing the wallet key.
8. Record the request ID and result as adoption/demo evidence.

## Manual smoke tests

The browser route is:

```text
https://veridex-ecru.vercel.app/telegraph/application/
```

The machine endpoint is:

```text
POST https://veridex-ecru.vercel.app/track3
Content-Type: application/json

{"chain":"1","contractAddress":"0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"}
```

Expected top-level result:

```text
schema = veridex.track3.application.v1
analysis = deterministic Veridex observation
telegraph = live secondary intelligence state
 decision = CORROBORATED | CONFLICTED | DETERMINISTIC_ONLY | INCONCLUSIVE
```

A successful deterministic response is not proof that Telegraph was used. For Track 3 evidence, inspect `telegraph.status`, `telegraph.intent`, `telegraph.miner`/`minerName`, payment metadata and the returned secondary review.

## Troubleshooting

### `track3_unavailable`

Check Vercel runtime logs for the request ID. The API deliberately returns a generic availability message and does not expose upstream secrets or internal network details.

Common causes:

- missing `TELEGRAPH_ENGINE_URL`
- internal-only `:8080` URL used from Vercel
- Telegraph Engine unreachable
- payment network rejected
- payment above configured cap
- invalid or missing burner key when payment is required
- upstream timeout

### `payment: unavailable`

This means Telegraph requested payment but no server-side key is configured. The deterministic analysis can still be preserved, but the Track 3 run is not a paid Telegraph-backed result.

### `payment: required` after the paid retry

Inspect the returned payment proof and runtime logs. A result without a successful settlement marker is not claimed as settled merely because the retry returned HTTP 200.

### `telegraph.review.assessment = invalid`

The provider returned an unstructured or schema-incompatible result. Treat it as inconclusive. Do not relax the parser in production to force a decision.

### `decision = CONFLICTED`

This is an intended safety state. Review both evidence sources. Do not change the code to flatten the disagreement simply to make the demo look cleaner.

### Browser gives `403 origin_not_allowed`

Set `VERIDEX_APP_ORIGIN` to the exact public production origin. Keep the origin check strict for the public application.

### Excessive spend / abuse

Lower `TRACK3_MAX_REQUESTS_PER_IP` or `TELEGRAPH_MAX_PAYMENT_USDC` and use a burner wallet with a small balance. The in-memory rate limiter is defense in depth, not an abuse-proof distributed quota system.

## Adoption evidence

Only collect real usage evidence:

- public production URL shared in community channels/X;
- real users running meaningful prompts/contract reviews;
- screenshots showing real result state and request IDs;
- payment/transaction proof where appropriate;
- downstream action only when it is genuinely produced by the application.

Never manufacture traffic or ask community members to generate meaningless repeated requests. The Track 3 goal is useful demand, not request volume for its own sake.

## Rollback

If a new production deployment breaks the Track 3 route:

1. identify the last Vercel `READY` deployment with known-good CI;
2. roll back through Vercel;
3. verify `/telegraph/application/` and `/track3`;
4. keep the failed commit visible in Git history for diagnosis;
5. fix forward with a new commit and a clean CI run.

Do not delete evidence of a failed deployment or rewrite history to hide it.
