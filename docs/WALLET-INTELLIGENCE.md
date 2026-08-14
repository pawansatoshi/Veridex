# Veridex Wallet Intelligence

## Purpose

Veridex remains a contract-capability intelligence product. Address detection is the front door so a wallet address is never incorrectly treated as a smart contract.

## Decision tree

```text
address input
  -> format detection
  -> chain-family classification
  -> EVM on-chain bytecode check
       -> EOA/wallet: wallet-safety mode
       -> contract: Veridex contract intelligence
  -> non-EVM: honest detection + unsupported-for-H1 message
  -> unknown: no chain guess
```

## H1

H1 contract analysis is intentionally EVM-first. The current Phase 01 analyzer depends on EVM JSON-RPC, EVM bytecode and EVM proxy semantics. Telegraph itself is not limited to EVM: the hackathon describes Miners as wrappers around any API, model, dataset or tool. Therefore multi-chain support is a Veridex architecture opportunity, not a reason to fake non-EVM contract analysis in H1.

## Wallet safety foundation

The product should eventually provide a separate wallet surface for EVM accounts. Candidate checks include:

- native asset balance and activity context
- token allowance exposure
- unlimited ERC-20 allowance identification
- spender contract capability analysis through the existing Veridex core
- suspicious or high-risk spender signals
- approval changes over time
- transaction simulation/risk signals where a trustworthy simulator is available

An unlimited allowance is a risk signal, not proof of maliciousness. Veridex must state exactly what authority exists, who controls it, and what evidence supports the risk classification.

### Important limitation

Discovering *all* token approvals cannot be done reliably from `eth_getCode` or a single RPC call. A production approval scanner needs token discovery/indexing and log/history access. Until that dependency exists, Veridex must not claim exhaustive wallet approval coverage.

## Multi-chain expansion

The detector recognizes common address families, but format detection is not equivalent to full chain support. Each additional chain requires a dedicated adapter implementing:

1. canonical address validation/checksum rules
2. account vs contract/object/program semantics
3. chain RPC/provider abstraction
4. code/module/program retrieval
5. verification/source evidence where available
6. capability vocabulary appropriate to that chain
7. ground-truth corpus and regression tests

Initial future adapters: Solana, Sui/Move, Aptos/Move, Bitcoin, TRON, Cardano and Cosmos SDK families. They must be implemented independently and never routed through the EVM analyzer.

## Product principle

**Detect first. Analyze second. Never guess.**
