# Phase 04 — Continuous Watch

## Exit contract

`ADD CONTRACT → INITIAL PASSPORT → WATCH ACTIVE → OBSERVE → COMPARE → CHANGE CLASSIFY → ALERT → NEW PASSPORT VERSION`

Phase 04 adds the deterministic domain engine for persistent Capability Watches. A watch has a bounded polling interval, adaptive backoff, an observation budget per scheduler tick, versioned passports, capability diffs and evidence-backed alert payloads.

## Safety rules

- A failed observation is `inconclusive`, never a contract change.
- Provider/API failure is never converted into a negative capability.
- Alerts require a conclusive comparison.
- Upgradeability and mint changes are critical; ownership/pause changes are warnings; other evidenced changes are informational.
- Polling is bounded by minimum/maximum intervals and a per-tick observation budget.
- Watch state is represented behind a `WatchStore` interface so production persistence can be supplied by a durable datastore without coupling the domain layer to a vendor.

## Implemented

- `CapabilityWatch` lifecycle model
- adaptive polling intervals
- bounded scheduler work per tick
- baseline/unchanged/changed/inconclusive comparison states
- versioned Capability Passport observations
- evidence-backed capability diffs
- severity classification
- alert sink contract
- in-memory reference store for deterministic tests
- regression tests for baseline, change detection and provider failure

## Production persistence boundary

The domain engine intentionally does not pretend that serverless process memory is durable. A production deployment must provide a durable `WatchStore` implementation and invoke `CapabilityWatchScheduler.tick()` from a persistent scheduler/cron worker. This is an explicit infrastructure adapter boundary, not simulated persistence.

## Exit evidence

Phase 04 is considered GREEN only when typecheck, build, dedicated watch tests and Phase 03 passport regression tests pass on the same current commit. Production persistence/cron integration must not be represented as complete until a real durable store and scheduler are connected and verified.
