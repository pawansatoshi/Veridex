# Veridex Multi-Chain Address Architecture

## Purpose

Veridex is **address-first**, not EVM-blind. Every user-supplied address is classified before contract analysis.

```text
Address
  -> format detection
  -> chain-family classification
  -> EVM wallet/contract resolution when applicable
  -> chain-specific analyzer only when supported
```

## Current detection coverage

- EVM 20-byte hexadecimal address format
- Sui-style 32-byte hexadecimal address format
- Aptos/Move short hexadecimal address format
- NEAR implicit account format
- Solana Base58 public-key format
- Bitcoin bech32/bech32m prefix format
- TRON Base58 format
- Cardano Shelley address prefix format
- Cosmos SDK bech32 account format
- explicit unknown state

Detection is deliberately conservative. A format that is shared by multiple ecosystems is reported as a family/ambiguous class rather than being presented as proven chain identity.

## EVM classification

An EVM-shaped address is not automatically a contract.

Veridex performs `eth_getCode` before contract intelligence:

- `0x` runtime code -> EVM wallet/EOA
- non-empty runtime bytecode -> EVM smart contract
- RPC failure -> address format remains known, contract-vs-wallet state is unavailable

The contract analyzer is never run against an address that has been conclusively identified as an EOA.

## Supported analysis boundary

H1 contract intelligence is EVM-first because the current Veridex capability engine is based on EVM bytecode, ABI and EVM storage semantics.

Non-EVM detection does **not** imply non-EVM contract analysis is implemented. Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and other ecosystems require separate chain adapters and semantic analyzers.

Future adapter interface:

```text
AddressDetector
  -> ChainAdapter
       -> account/contract/program/object classification
       -> code/module/program retrieval
       -> verification source
       -> capability model
       -> normalized Veridex intelligence
```

The normalized result must preserve chain-specific evidence without forcing non-EVM semantics into EVM fields.

## Product rule

**Detect first. Analyze second. Never guess.**

A detected non-EVM address receives a clear unsupported-analysis response until the corresponding adapter exists.
