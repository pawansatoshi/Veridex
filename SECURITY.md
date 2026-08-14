# Veridex Security Policy

## Repository boundary

Veridex source code is proprietary project IP unless the repository owner explicitly publishes a file or repository as open source. Production users receive the web product/API surface, not a license to reproduce or redistribute the private source.

## Architecture rule

Sensitive logic belongs server-side. The browser is treated as an untrusted environment.

Never put these in client bundles:

- RPC credentials
- verification API keys
- private signing material
- internal service credentials
- privileged admin tokens
- proprietary scoring secrets

## Production hardening

- repository should be private when the owner wants source protection
- Vercel production access should be restricted to authorized developers
- secrets belong in Vercel environment variables, never Git
- production source maps should not be published unless deliberately required
- API boundaries validate input and classify failures explicitly
- security headers are applied at the Vercel edge
- no private-key custody or signing is performed by Veridex

## Important limitation

A public website necessarily exposes some client-side HTML/CSS/JavaScript. This cannot be made impossible to inspect. Source protection therefore depends on keeping proprietary computation and secrets on the server, not on obfuscation.

## Repository access

The GitHub connector available to the coding agent does not expose a repository-visibility mutation. Therefore this file documents the required owner-side control: set `pawansatoshi/Veridex` to **Private** in GitHub repository Settings → Danger Zone → Change repository visibility, then grant only trusted developers access.

Do not claim the repository is private until GitHub repository metadata confirms it.
