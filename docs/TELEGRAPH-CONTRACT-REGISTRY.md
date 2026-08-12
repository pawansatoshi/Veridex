# Telegraph Official Smart-Contract Registry

## Purpose

This is the authoritative Veridex record for **official Telegraph smart-contract addresses and protocol contract interfaces used by Veridex**.

## Safety Rule

Do not populate an address from memory, a community post, an explorer search, or an unofficial deployment.

Every entry requires an official source citation and verification date.

## Registry Status

**Pending official-address extraction and verification.**

The current official Telegraph docs expose an **Addresses & Parameters** section, but this repository does not yet contain a verified address table. We deliberately do not copy unverified constants into Veridex.

## Required Entry Format

| Network | Contract | Address | Purpose | Source | Verified | ABI/Interface | Status |
|---|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | Official Telegraph docs/repo | TBD | TBD | pending |

## Expected Categories

When verified from official sources, catalog at minimum:

- protocol/core contracts
- Miner-related contracts
- Validator-related contracts
- registry/identity contracts if part of Miner operation
- payment/x402-related contracts if the official integration requires direct contract interaction
- any chain-specific protocol contracts required by the chosen Intent

Do not assume every protocol contract must be called by Veridex. The registry records official contracts; the implementation should import only the contracts it actually needs.

## Verification Procedure

1. Open the current official Telegraph Addresses & Parameters documentation.
2. Record network and contract name exactly as published.
3. Record address exactly.
4. Record purpose.
5. Record source URL and section/file.
6. If an ABI is published, record its source.
7. Confirm deployment/network consistency.
8. Add verification date.
9. Add a decision entry if the contract changes architecture.
10. Add tests before using the address in production code.

## Update Policy

If Telegraph changes a contract address or deployment:

- never silently overwrite historical data
- mark the old deployment deprecated
- add the new deployment with source provenance
- update runtime configuration
- run integration tests
- update the project state
