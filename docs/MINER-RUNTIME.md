# Veridex Miner Runtime

The H1 bridge is a small dependency-free HTTP adapter around the deterministic analysis core.

## Production endpoints

### `GET /health`

Returns a liveness response:

```json
{
  "ok": true,
  "service": "veridex-miner",
  "version": "0.1.0"
}
```

### `GET /metrics`

Returns bounded latency samples with p50/p95/p99 plus cache counters.

### `POST /analyze`

This is the Telegraph-facing production endpoint.

Request:

```json
{
  "chain": "1",
  "contractAddress": "0x0000000000000000000000000000000000000000",
  "codeAddress": "0x0000000000000000000000000000000000000000"
}
```

`codeAddress` is optional. It is intended for explicit proxy implementation targeting; normal callers should provide only `contractAddress` and let Veridex resolve the code address.

Accepted `chain` values are `1`, `ethereum`, and `ethereum-mainnet`; the response always normalizes the chain to `1`. Other chains are rejected because the H1 Miner is currently Ethereum-mainnet only.

Success responses use one stable envelope in both the Vercel production handler and the standalone Miner runtime:

```json
{
  "schema": "veridex.miner.v1",
  "result": {
    "contract": {},
    "proxy": {},
    "verification": {},
    "capabilities": [],
    "evidence": [],
    "confidence": 0,
    "conclusive": false,
    "providerStatus": {}
  },
  "capabilityIntelligence": {
    "subject": {},
    "capabilityMap": [],
    "evidenceGraph": [],
    "state": "established",
    "confidence": 0
  }
}
```

The exact JSON response is validated by `npm run verify:production-schema` against the live production deployment. The same envelope is covered by `src/miner/http.test.ts` to prevent the standalone runtime and Vercel adapter from drifting apart.

Provider failures are represented as evidence/status and are never converted into negative contract findings.

## Telegraph integration boundary

For the current Vercel deployment:

- `base_url`: `https://veridex-ecru.vercel.app`
- Telegraph-facing `path`: `/analyze`
- upstream `external_path`: `/analyze`
- method: `POST`
- auth: none
- request body: JSON
- request fields: `chain`, `contractAddress`, optional `codeAddress`
- success schema: `veridex.miner.v1` envelope above

The final `supported_intents` value is deliberately not hard-coded here until an official, semantically correct canonical Telegraph Intent is confirmed for contract-capability intelligence. Veridex must not register under `ONCHAIN_TX_LOOKUP` or another unrelated Intent merely because it is available.

## Environment

- `VERIDEX_RPC_URL` — required JSON-RPC endpoint.
- `VERIDEX_RPC_TIMEOUT_MS` — optional, 100–30000 ms.
- `VERIDEX_RPC_MAX_RETRIES` — optional, 0–5.
- `VERIDEX_RPC_RETRY_BASE_MS` — optional, 10–2000 ms.
- `VERIDEX_CIRCUIT_FAILURE_THRESHOLD` — optional, 1–20.
- `VERIDEX_CIRCUIT_RESET_MS` — optional, 1000–300000 ms.
- `VERIDEX_SOURCIFY_CHAIN_ID` — optional numeric chain ID. When present, the built-in Sourcify provider is enabled.
- `PORT` — optional HTTP port, default `8787`.

## Run

```bash
npm install
npm run build:core
VERIDEX_RPC_URL=https://your-rpc.example npm start
```

No private key or transaction signing is required. The Miner is read-only.

## Security boundary

The standalone request body is capped at 64 KiB, contract addresses are strictly validated, JSON is parsed defensively, responses are `no-store`, and the core retains explicit inconclusive/unavailable/error states.

The Vercel production route inherits Vercel's request parsing/limits and applies the same semantic request validation before analysis.
