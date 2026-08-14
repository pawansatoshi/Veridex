# Veridex H1 Owner Action Runbook

This file contains the few actions that require the project owner/account holder. Code-side work should not be blocked on these unless the step is explicitly marked P0.

## P0 — before Track 1 opens (owner action)

1. Confirm Telegraph Hackathon registration is completed.
2. Join the official Telegraph support/community channel available to registered participants.
3. Keep the GitHub repository visibility consistent with the official submission requirement; do not make it private unless the official submission instructions explicitly allow private source repositories.
4. Prepare/confirm a dedicated Miner signing/registration wallet if Telegraph requires one. Never place its private key or seed phrase in GitHub, Vercel, browser code, screenshots, or chat.
5. Keep the wallet funded only as required by the official registration/payment flow.
6. On Aug 17, verify the live H1 Intent registry and provide/confirm the exact supported Intent contract if the official team publishes one that matches Veridex capability intelligence.

## P0 — once the Intent contract is known

1. Run `npm run telegraph:intents` and preserve the output.
2. Configure the exact Intent name/schema only from official documentation or the official support channel.
3. Run `npm run typecheck`, `npm run build:core`, and `npm test` locally if a local environment is available.
4. Deploy the Miner endpoint and verify `/health`.
5. Run the bounded benchmark:

```bash
VERIDEX_MINER_URL=https://YOUR-MINER-DOMAIN \
VERIDEX_BENCHMARK_ADDRESS=0xYOUR_REAL_CONTRACT \
VERIDEX_BENCHMARK_CHAIN=ethereum \
npm run benchmark:miner
```

6. Preserve the JSON benchmark output as evidence. Do not edit or inflate it.

## P1 — Track 1 / Track 2 communication

- Post meaningful technical progress on X.
- Tag `@Telegraphprotoc` on judging updates as required by the official rules.
- Share real benchmark results, failures, and fixes.
- Do not manufacture requests, engagement, or performance.

## P1 — Track 3 (Aug 31–Sep 7)

1. Keep the Miner live.
2. Ensure at least one real application/agent uses the live Miner.
3. Do not use mock Miner responses in the application.
4. Collect real request counts, latency, errors and uptime evidence.
5. Pursue legitimate application demand. The 100-request global-prize guardrail is an ecosystem condition and cannot be fabricated by repeatedly self-querying.

## Security rules for the owner

- Never paste private keys, seed phrases, API secrets, or Vercel secrets into chat or GitHub.
- Never commit `.env` files containing secrets.
- Never make a public claim that a feature is implemented until the repository and live deployment prove it.
- Never switch the repository private/public solely for source protection without checking the official hackathon submission requirement.

## What the owner does NOT need to do now

Do not manually build Wallet Safety, Solana/Sui semantic analysis, Passport runtime, Watch runtime, Policy, Alerts, Mobile, or 3D UX during the H1 Miner critical path.
