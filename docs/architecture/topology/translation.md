# Topology — Translation

## Scope

This page describes the translation pipeline as a shared system used by **`generate`** (full runs and **`--resume`**).

## Pipeline shape

1. Command host resolves config, runtime flags, and targets.
2. Translation provider chain is resolved from config/env/pin context.
3. Leaf-level translation executes with retries/fallback behavior.
4. Policy + metadata decisions are applied to translated leaves.
5. Output locale JSON (and optional metadata sidecar) is produced.
6. Result summary/issues are emitted to human output and JSON envelope.

## Shared concerns

- Provider eligibility and credential readiness
- Retry/fallback routing
- Partial-run behavior and resumability
- Structured issue emission for machine consumers

## Boundaries

- **CLI host:** prompts, banners, command summaries, run events wiring.
- **Core logic:** translation decisions, provider orchestration internals, leaf transforms.

## Current vs planned

- **Shipped:** core owns orchestration and config resolution; CLI consumes stable run outputs.
