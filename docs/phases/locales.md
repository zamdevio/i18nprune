# Phase — `locales` subcommands (`list` / `edit` / `dynamic` / `delete`)

**Status:** **Completed** (CLI scope for this phase — `list` / meta **`edit`** / **`dynamic`** / **`delete`** + **`--json`**). Follow-ups (loader auto-patch) live under [ADR 004](../architecture/decisions/004-auto-patch.md). **Roadmap:** [phases README](./README.md) + [active-phase.md](./active-phase.md). **key-sites** can continue in parallel ([key-sites.md](./key-sites.md)).

**User docs:** [commands/locales](../commands/locales/README.md) (tracked).

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Reality vs `packages/cli/src/commands/locales/*`

| Command | Implementation | Notes |
|---------|----------------|--------|
| **`i18nprune locales list`** | **Shipped** | Enumerates **`*.json`** under **`localesDir`**, leaf counts, English-identical hints vs source; **`--json`** → **`kind`: `locales-list`**. |
| **`i18nprune locales edit`** | **Shipped (meta)** | Writes **`<lang>.meta.json`** (`englishName`, **`nativeName`**, **`direction`**); not ADR 004 loader patching. |
| **`i18nprune locales dynamic`** | **Shipped** | Same dynamic scan as **`validate`**; full **`sites`** in JSON; human listing uses **`--top` / `--full`**. |
| **`i18nprune locales delete`** | **Shipped** | **`--target`** as one code, list, or **`all`**; **`--json`** + destructive runs require **global `--yes`**; no stdin prompts in JSON mode. |

---

## Dependencies (ordering) — updated

1. ~~**`locales list`**~~ — **done** (read-only, no ADR 004).
2. **`locales edit` (loader / ADR 004)** — **future**; today’s **meta-only** edit does not require ADR 004.
3. **JSON / parity** — **done** for all four subcommands (**`COMMANDS_WITH_JSON_OUTPUT`**, typed payloads under **`types/command/locales/json.ts`**).

---

## Goals

| Goal | Command | Status |
|------|---------|--------|
| Real **listing** | **`list`** | **Shipped** |
| **Meta profile** edit | **`edit`** | **Shipped** (sidecar fields) |
| Parity with **`--json`** | all | **Shipped** |

---

## Acceptance (close the phase)

- [x] **`locales list`**: enumerate locale JSON under **`localesDir`**, show useful counts, fail fast if **`localesDir`** missing.
- [x] **`locales edit`**: writes **`<lang>.meta.json`** with documented flags; not a permanent stub.
- [x] User docs and [behavior / commands](../behavior/commands.md) updated to match.
- [x] Integration coverage for JSON envelopes and key flows (as in repo tests).

**Remaining (optional / later):** ADR 004 **auto-patch** of loader wiring from **`locales edit`** — tracked on [ADR 004](../architecture/decisions/004-auto-patch.md) and [Roadmap](../roadmap/README.md).

---

## Non-goals (this phase)

- Replacing **`sync`**, **`fill`**, or **`generate`** — orchestration stays in [missing-pipeline.md](./missing-pipeline.md).
- Full IDE integration — CLI scope only.

---

## Planning — parity with `generate` / `fill` / `validate` (prompts, exit codes, `--json`)

**Status:** **Largely implemented** — see user docs for the matrix. Destructive **`delete --json`** requires **global `--yes`**; no interactive prompts on stdin when **`--json`** is set.

### Prompt selection (interactive vs stable / non-interactive)

| Principle | Behavior |
|-----------|----------|
| **Context-driven** | TTY flows use stable menus / confirms where documented. |
| **No prompts when not allowed** | **`--json`**: no stdin prompts; use explicit **`--target`** / **`--yes`**. |
| **Resolved** | Destructive **`delete`** in JSON mode: **`--yes`** required (documented). |

### `CliJsonEnvelope` shape (per subcommand)

- **`kind`**: `locales-list` \| `locales-edit` \| `locales-dynamic` \| `locales-delete`
- **`data`**: typed in **`packages/cli/src/types/command/locales/json.ts`**
- **`issues[]`**: **`i18nprune.locales.usage`**, **`i18nprune.locale.target_not_found`**, … — [issue codes](../json/issue-codes.md)

### Acceptance for “locales CLI parity”

- [x] Documented matrix of **prompts vs `--json` vs `--yes`** ([commands/locales](../commands/locales/README.md)).
- [x] **`--json`** produces a single parseable primary document for each subcommand.
- [x] User docs and [behavior / commands](../behavior/commands.md) updated.

---

## See also

- [phases README](./README.md)
- [phases README](./README.md)
- [validate.md](./validate.md)
- [ADR 004 — auto-patch](../architecture/decisions/004-auto-patch.md)
- [commands/locales/dynamic](../commands/locales/dynamic/README.md), [delete](../commands/locales/delete/README.md)
