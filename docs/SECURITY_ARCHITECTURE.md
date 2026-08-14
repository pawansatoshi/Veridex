# Veridex Production Security Architecture

## Public product / private implementation

```text
Public Internet
   -> Veridex web UI
   -> minimal public API
   -> server-side analysis boundary
   -> private intelligence implementation
   -> RPC / verification providers
```

The public website is intentionally usable by everyone. GitHub source and privileged infrastructure are separate access domains.

## What is protected

### Repository

Keep GitHub repository private and grant access only to authorized developers. GitHub visibility is an account/repository control, not an application feature.

### Server-side secrets

Store secrets only in deployment environment variables. Never expose them through `index.html`, browser JavaScript, logs, JSON responses, or source maps.

### Proprietary intelligence

Capability logic, provider orchestration, scoring policy, anti-abuse policy and future Wallet Safety logic should remain server-side whenever practical.

### Public API

Only expose the minimum endpoints required by the product/protocol. Validate all input, cap request size, rate-limit abuse, classify failures, and avoid leaking stack traces/internal provider details.

## Client-side reality

A public browser application cannot make its HTML/CSS/JavaScript invisible to its users. Do not rely on minification, obfuscation, disabled context menus, or similar techniques as security controls.

## Developer access

Use least privilege:

- GitHub: only trusted developers
- Vercel: only trusted project members
- production secrets: only required environments
- branch protection: required reviews/status checks when team size permits
- deployment: production branch only

## Wallet Safety

No private keys, seed phrases or signing credentials should ever reach Veridex servers. Wallet safety is observation/intelligence only unless a future product explicitly introduces a separately reviewed signing flow.

## H1 constraint

Security controls must protect the Miner without changing deterministic analysis semantics. Security errors must never be converted into false capability results.
