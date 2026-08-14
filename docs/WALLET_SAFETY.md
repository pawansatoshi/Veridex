# Veridex Wallet Safety — Post-H1 Extension

Wallets and contracts are intentionally separate product modes.

## Address flow

```text
Any address
  -> detect
  -> EVM wallet?
       yes -> Wallet Safety
       no  -> contract/program analysis when supported
```

## Planned EVM wallet signals

- native balance and account state
- ERC-20 approval/allowance risk
- unlimited allowance detection
- spender contract analysis through Veridex
- suspicious or high-risk spender signals when supported by evidence
- recent permission changes
- transaction-risk signals

## Safety semantics

An unlimited allowance is a **risk signal**, not proof of maliciousness.

The UI should explain:

- token
- spender
- allowance
- evidence source
- freshness/window
- whether the result is exhaustive or bounded

Veridex must never claim that all approvals were inspected when it only inspected a bounded log window or user-supplied token/spender pair.

## H1 boundary

Wallet Safety is not part of the H1 Miner capability score. H1 remains focused on deterministic smart-contract capability intelligence. The address detector and EVM wallet-vs-contract gate are H1-compatible safety/UX foundations.

## Architecture

Wallet Safety can reuse the same evidence and contract intelligence layers:

```text
Wallet
 -> approval/permission observation
 -> spender address
 -> contract classification
 -> Veridex capability analysis
 -> evidence-backed risk explanation
```

No private keys, signing, transaction submission, or custody is required by this architecture.
