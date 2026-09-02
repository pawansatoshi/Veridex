# Track 3 — Application / Agent Consumption

## Purpose

Veridex Track 3 is the public evidence-first application at `/telegraph/application/`. It is a production consumer of the live Veridex analysis service and, when configured, the Telegraph Engine/x402 intelligence layer. It is not a simulated workload and it does not depend on the Track 2 scorer.

## Production flow

```text
User / bounded agent
        ↓
Veridex Track 3 web application
        ↓
POST /track3
        ↓
Deterministic EVM analysis ───────────────┐
        ↓                                │
Capability Intelligence + Passport       │
        │                                │
        └────────→ Telegraph Engine /v1/ask
                         ↓
                    x402 if required
                         ↓
                live Miner/provider result
                         ↓
          normalization + conflict handling
                         ↓
             confidence-aware decision
                         ↓
       evidence / provenance / user action
```

The deterministic Veridex observation remains the primary evidence model. Telegraph is an independent intelligence signal; malformed, unavailable or contradictory external output is preserved as such rather than silently converted into a security fact.

## Application contract

- Accept an Ethereum EVM contract address.
- Reject malformed input without guessing.
- Execute the existing deterministic analysis path.
- Request secondary intelligence from the live Telegraph Engine through a server-side integration.
- Use x402 payment when the Engine returns `402 Payment Required`.
- Never expose the EVM payment private key to browser code.
- Enforce a server-side payment ceiling and request rate limit.
- Render ownership, upgradeability, pause and mint observations from Veridex.
- Render Telegraph intent/provider/payment state when the live response exposes it.
- Accept only a bounded structured Telegraph review; unstructured provider prose is inconclusive.
- Surface explicit conflict when the Telegraph review contradicts deterministic posture.
- Preserve unavailable/inconclusive states and never turn provider failure into a negative finding.
- Keep the UI usable on mobile and desktop.

## Production endpoint

The public application is deployed at:

`https://veridex-ecru.vercel.app/telegraph/application/`

The Track 3 API is:

`POST https://veridex-ecru.vercel.app/track3`

The endpoint accepts JSON with `chain: "1"` and `contractAddress` and returns the versioned `veridex.track3.application.v1` result when analysis succeeds.

## Telegraph configuration

Production requires a verified, externally reachable Telegraph Engine URL and a server-side burner EVM key when the Engine requires payment.

Supported environment variables:

- `TELEGRAPH_ENGINE_URL` — Engine base URL; do not hard-code an internal-only `:8080` endpoint into a public serverless deployment.
- `TELEGRAPH_EVM_PRIVATE_KEY` — server-side burner key only; never commit or expose it to the browser.
- `TELEGRAPH_MAX_PAYMENT_USDC` — maximum amount permitted per request; default `0.05`.
- `TELEGRAPH_ALLOWED_NETWORKS` — allowed x402 CAIP-2/network identifiers.
- `TELEGRAPH_TIMEOUT_MS` — request timeout; default `20000` ms.
- `TRACK3_MAX_REQUESTS_PER_IP` — lightweight per-instance request budget; default `8` per ten minutes.
- `VERIDEX_APP_ORIGIN` — browser-origin allowlist; defaults to the production Veridex origin.

The current Telegraph documentation describes the Engine as an `/v1/ask` surface authenticated by x402 and describes port `7044` as the public node API while port `8080` is an internal Engine subprocess. Configuration therefore must be verified against the live Telegraph deployment before release. citeturn618968search0turn618968search2

## Live demo path

1. Open the Track 3 application.
2. Enter USDC, WETH9 or Uniswap V3 SwapRouter.
3. Run the live review.
4. Inspect deterministic capability evidence.
5. Inspect the Telegraph Intelligence panel and verify provider/intent/payment state.
6. Open the evidence, Passport or deterministic analysis surfaces.
7. Share the application URL with real community users and collect only genuine usage evidence.

## Real-adoption evidence

Track 3 value comes from real production use. Use the public web interface, share it in the Telegraph community and X, and record actual request/results screenshots or exported machine results. Do not generate synthetic users, scripted spam, fabricated request counts or fake downstream activity.

For autonomous usage, an agent may make sustained real requests when those requests correspond to meaningful application decisions; network spam is not an adoption strategy.

## Failure semantics

The following states are intentional:

| State | Meaning |
| --- | --- |
| `CORROBORATED` | Deterministic evidence is conclusive and Telegraph explicitly supports the posture. |
| `CONFLICTED` | Telegraph explicitly contradicts deterministic posture; disagreement is retained. |
| `DETERMINISTIC_ONLY` | Telegraph is unavailable or not configured; deterministic evidence remains separate. |
| `INCONCLUSIVE` | Available evidence is incomplete or the provider result cannot be safely interpreted. |

## Security boundaries

The browser only receives the structured Track 3 result. The Telegraph payment key stays on the server. The API caps per-request payment, checks allowed payment networks, validates the payment response metadata and rate-limits public use. These controls reduce accidental spend but do not replace a low-funded burner wallet.

## Submission integrity

Track 3 evidence must be based on real production requests and live Telegraph responses. No fabricated traffic, users, ranking, demand, performance or transaction claims are permitted. Repository code and CI are engineering evidence; they are not proof that a current external service was reachable at a particular moment without a fresh runtime check.
