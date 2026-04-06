# `doctor`

Read-only **diagnostics** for local setup and CI.

## Data flow

1. **`preAction`** sets **`RunOptions`** (including **`--json`**) and skips **`ensureConfig`** so `doctor` runs without writing a config.
2. **`runDoctorCommand`** (`src/commands/doctor/index.ts`) runs checks in order: **`runtime`** → **`tools`** → **`config`** → **`paths`**.
3. Each check returns a **`DoctorFinding`**: **`id`**, **`severity`** (`ok` | `warn` | `error`), **`title`**, optional **`detail`**.
4. **Human mode:** lines go through **`logger`**; **`printCommandSummary`** ends the session.
5. **`--json`:** one JSON object: `{ kind: 'doctor', findings, strict }` on stdout.

## Flags

| Flag | Role |
|------|------|
| **`--only <list>`** | Comma-separated subset: `runtime`, `tools`, `config`, `paths` (default: all) |
| **`--strict`** | Treat **`warn`** as failure (exit **1**) |
| **Global `--json`** | Machine-readable output for scripts / CI |

## Exit codes

- **0** — No **`error`** findings; with **`--strict`**, no **`warn`** either.
- **1** — Any **`error`**; or any **`warn`** when **`--strict`** is set.

## Checks (predicates)

| ID | What |
|----|------|
| `runtime` | Node.js **≥ 18** |
| `tools` | **`rg --version`** on PATH (warn if missing) |
| `config` | Config file present vs defaults (warn if missing) |
| `paths` | Resolved **source locale**, **locales dir**, **src root** exist (`paths` **error** if source JSON missing) |

```bash
i18nprune doctor
i18nprune doctor --only runtime,tools
i18nprune --json doctor --strict
```
