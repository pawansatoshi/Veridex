# Veridex H1 real-chain corpus

The live H1 verification job uses a small, independently sourced Ethereum mainnet corpus. Expected capability labels are fixed in this file and are never derived from the Miner response.

| Case | Address | Expected ownership | Expected upgradeability | Expected pause | Expected mint | Provenance |
|---|---|---:|---:|---:|---:|---|
| Circle USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | positive | positive | positive | positive | Circle contract registry + Etherscan verified proxy |
| WETH9 | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | negative | negative | negative | negative | Ethereum ERC-7528 reference + ethereum.org |
| Uniswap V3 SwapRouter | `0xE592427A0AEce92De3Edee1F18E0157C05861564` | negative | negative | negative | negative | Etherscan verified source/ABI |

## Verification protocol

1. Read the latest Ethereum block from an independent RPC provider.
2. Confirm every address has deployed bytecode with `eth_getCode`.
3. Send each address through the live Veridex Miner.
4. Compare each capability against the fixed expected labels above.
5. Record verification/provider status, proxy code address, confidence and conclusive state.
6. Fail the CI job on any capability mismatch or missing deployed bytecode.
7. Preserve the JSON result as a GitHub Actions artifact.

This corpus complements, rather than replaces, the deterministic adversarial fixtures already covered by the unit suite. The real-chain gate is intentionally small and high-confidence so a provider outage cannot silently rewrite expected labels.
