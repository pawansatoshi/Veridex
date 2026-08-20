# Track 3 — Application / Agent Consumption

## Purpose

Veridex's application is the evidence-first web experience in `index.html`. It is a real consumer of the Miner contract, not a simulated Track 3 workload.

## Production flow

```text
User / Agent
    ↓
Veridex web application
    ↓
Live Miner `/analyze`
    ↓
Capability Intelligence + Capability Passport
    ↓
Evidence / confidence / conclusive state
    ↓
Human or agent decision
```

## Application contract

- Accept an EVM contract address from the user.
- Reject malformed or unsupported inputs without guessing.
- Call the live Miner `/analyze` endpoint.
- Render ownership, upgradeability, pause and mint capability results.
- Preserve evidence-backed confidence and inconclusive/unavailable states.
- Never convert provider failure into a negative finding.
- Never display a local/mock result as production evidence.
- Keep the UI usable on mobile and desktop.

## Live endpoint

The production deployment is `https://veridex-ecru.vercel.app` and the application may consume `/analyze` through the configured deployment path.

## Demo path

1. Open the deployed application.
2. Enter a known Ethereum contract such as USDC, WETH9 or Uniswap V3 SwapRouter.
3. Inspect the capability result.
4. Inspect evidence and confidence.
5. Re-run the same address to demonstrate deterministic output and cache behavior.
6. Use the Capability Passport / Continuous Watch surfaces where available.

## Submission integrity

Track 3 evidence must be based on live Miner responses. No fabricated traffic, users, ranking, demand or performance claims are permitted.
