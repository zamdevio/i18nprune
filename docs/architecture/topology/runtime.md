# Topology — Runtime

## Scope

This page maps command runtime lifecycle from invocation to final output.

## Lifecycle

1. CLI entry initializes global run options and command routing.
2. Context/config is resolved (paths, env overlays, discovery metadata).
3. Command executor runs domain pipeline(s).
4. Output policy gates human logs/progress for quiet/silent/json modes.
5. JSON envelope (when enabled) or human summary is written.
6. Report/cache/patch side effects run where configured.

## Runtime contracts

- Output modes:
  - human (styled)
  - quiet/silent gating
  - machine JSON envelope
- Stable machine-facing fields:
  - envelope metadata
  - issues payload
  - operation-specific result data

## Boundaries

- **Host runtime:** process/env/TTY interactions
- **Core runtime-neutral logic:** operation internals and typed outputs

## Current vs planned

- **Shipped:** runtime orchestration centers on core `runXxx` entries with thin CLI command shells.
