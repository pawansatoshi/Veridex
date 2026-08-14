# Veridex Miner Runtime

The H1 bridge is a small dependency-free HTTP adapter around the deterministic analysis core.

## Endpoints

### `GET /health`

Returns a liveness response.

### `GET /metrics`

Returns bounded latency samples with p50/p95/p99.

### `POST /analyze`

Request:

```json
{
  "chain": "1",
  "contractAddress": "0x0000000000000000000000000000000000000000",
  "codeAddress": "0x0000000000000000000000000000000000000000"
}
```

`codeAddress` is optional. It is intended for explicit proxy implementation targeting; normal callers should provide only `contractAddress` and let Veridex resolve the code address.

The response is wrapped as `schema: veridex.miner.v1` and contains the normalized analysis object. Provider failures are represented as evidence/status and are never converted into negative contract findings.

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
npm run build
VERIDEX_RPC_URL=https://your-rpc.example npm start
```

No private key or transaction signing is required. The Miner is read-only.

## Security boundary

The request body is capped at 64 KiB, contract addresses are strictly validated, JSON is parsed defensively, responses are `no-store`, and the core retains explicit inconclusive/unavailable/error states.

The adapter is intentionally schema-neutral with respect to Telegraph until the exact currently supported H1 Intent request/response/evaluation contract is verified. It does not invent a Telegraph Intent or claim registration merely because the HTTP bridge exists.
