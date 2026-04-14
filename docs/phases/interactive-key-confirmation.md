# Interactive key confirmation (`--ask`)

**Status:** **shipped** for `cleanup` (batch + per-key). Other commands remain optional follow-ups.

## Shipped behavior (`cleanup`)

| Flag | Effect |
|------|--------|
| **`--ask`** | TTY only: after computing candidate removals, prompt **per top-level namespace** (segment before first `.`). Global **`--yes`** skips all prompts. |
| **`--ask-per-key`** | With **`--ask`**: one confirm per key (can be noisy). |
| **Global `--yes`** | Overrides **`--ask`** — full candidate list is removed without interactive prompts. |

Ignored when:

- **`--check-only`** or **`--json`** (no interactive prompts).
- Not a TTY — **`--ask`** is ignored (info log); use **`--yes`** or bulk confirm as today.

## Implementation

- **`packages/cli/src/core/ask/removal.ts`** — `groupKeysByTopSegment`, `promptApprovedRemovalKeys`.
- **`packages/cli/src/commands/cleanup/index.ts`** — wires flags after `safeToRemove` is computed.

## Follow-ups (not required to close sprint)

- `fill` / `locales delete`: opt-in **`--ask`** using the same helpers.
- Config key `reference.commands.cleanup.askGroupBy` if we need finer grouping than top segment.

## Related

- [CLI prompt modules](../cli/prompts/README.md)
- [Key reference unification](./key-reference-unification.md)
- [active-phase.md](./active-phase.md)
