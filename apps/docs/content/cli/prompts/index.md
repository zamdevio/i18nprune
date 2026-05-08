# CLI prompt modules (convention)

For **Inquirer scope, `--json`, CI, and utils debt**, see the canonical page: **[Prompts & CLI boundaries](../../prompts)**.

## Per-command prompts

Commands that need **interactive flows specific to that command** keep a local module:

- Example: `packages/cli/src/commands/generate/prompts.ts` — language selection, meta prompts, banners **only** for `generate`.

Naming: **`commands/<command>/prompts.ts`** (or a `prompts/` folder if the command grows many flows).

## Shared prompts for key-affecting commands

Destructive or high-impact commands that confirm **per key** or **per batch** use **`core/ask/`**:

- **`canAsk`** (`gate.ts`) — TTY / JSON / CI gating.
- **`promptApprovedRemovalKeys`** / **`groupKeysByTopSegment`** (`removal.ts`) — shared cleanup-style confirmations.

**Shipped:** `cleanup --ask` / `--ask-per-key` — see [`docs/commands/cleanup/README.md`](../../commands/cleanup) for behavior.

Conventions:

- **Messages stay parameterized** via `PromptRemovalKeysOptions` and future typed builders for other commands.
- **Global `--yes`** overrides **`--ask`**.
- **No prompts** when **`--json`** is the contract for machine-readable stdout (see [JSON output (`--json`)](../../json)).

## Precedence

Where both apply: **global `--yes` wins** over **`--ask`** — non-interactive automation must not block on per-key prompts.

## See also

- [JSON output (`--json`)](../../json) — when `--json` is set, stdout is the machine-readable contract (no interactive prompts).
- [ADR 006 — Command orchestrator boundary](../../architecture/decisions/006-command-orchestrator-boundary.md) — commands orchestrate; core owns logic.
- [Command orchestration boundary](../../commands/orchestration) — file layout inside `commands/<name>/`.
