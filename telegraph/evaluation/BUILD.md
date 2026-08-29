# Build checklist

1. Compile as freestanding `wasm32-unknown-unknown`.
2. Confirm there are no host imports.
3. Confirm required exports are present.
4. Run deterministic repeat tests with identical inputs.
5. Run malformed/empty/oversized-input tests.
6. Run the published Telegraph WASM validator before registration.
7. Register the accepted artifact and record its registration ID.

The repository should not claim a registration ID until the official platform accepts the exact binary.
