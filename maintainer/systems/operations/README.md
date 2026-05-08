# Operations — index

**Parent hub:** [`../README.md`](../README.md)

Practical maps for **`run.*`**, envelopes, and today’s **`runXxx`** entry paths. **Typing and payload shape** defer to **`packages/core/src/types/shared/run/`**. **Scheduling and slice memory** defer to **`maintainer/phases/`** (not a substitute for wiring here + code.)

Long-form prose companion (legacy / may shrink before v1): [`maintainer/OPERATIONS.md`](../../OPERATIONS.md).

## Files in this folder

| File | Purpose |
|------|---------|
| [`flows-and-entrypoints.md`](flows-and-entrypoints.md) | Mental model + emission summary, **`runXxx`** table, CLI vs core split |

## Contract changes

When **`run.*`** semantics, **`RunEmitter`** boundaries, or envelope rules change:

1. **Code + types first** (`packages/cli`, **`packages/core`**, **`types/shared/run/`**).
2. **Same PR:** update **`flows-and-entrypoints.md`** (and **`systems/commands/`** sheets if a specific op changes).
3. **Phases docs** (`maintainer/phases/`, **`extension/`** when extension-scoped) only if documenting **planned or shipped slice** intent—not as the only nav.

## Adding here

- New cross-cutting op topic → **new `kebab-case.md`** in **`operations/`** + add a row to the table above.
- **Scaffold:** [`../TEMPLATE.md`](../TEMPLATE.md).
