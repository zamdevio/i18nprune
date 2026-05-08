# Examples — advanced CLI workflows

These recipes combine **global flags**, **policies**, and **multiple commands** the way teams use **i18nprune** in real projects: CI, batch translation, and safe cleanup. Adjust paths to your repo.

Structured per-command examples live under [examples/commands](./commands).  
Template for new command pages: [examples/template](./template).
JSON shaping snippets: [jq cookbook](./jq-cookbook).

---

## CI: validate + machine-readable output

Fail the build if keys are missing or you need machine-readable diagnostics:

```bash
i18nprune validate --json
i18nprune doctor --json --strict
```

Pipe **`--json`** into jq or your own gates; exit codes are non-zero on failure where documented.

---

## Structured run reports (`stdout redirection`)

Write a **single artifact** after supported commands (sync, fill, cleanup, …):

```bash
i18nprune sync --dry-run stdout redirection ./artifacts/sync-report.json
i18nprune fill --lang all --dry-run stdout redirection ./artifacts/fill.txt --format text
```

Default format is **`json`**; override with **`--format`** or **``** in config. Use for **audits** and **dashboards** without parsing stdout.

---

## Sync all locales, then fill stale English-identical strings

```bash
i18nprune sync --lang all
i18nprune fill --lang all
```

**`--lang all`** targets every non-source locale under **`localesDir`**. Use **`--dry-run`** first on **`fill`** to estimate API usage.

---

## Safe cleanup: audit first, then apply

```bash
i18nprune cleanup --check-only --json
i18nprune cleanup --yes
```

Non-interactive destructive runs require **global `--yes`** (or use **`--check-only`** / **`--json`** for report-only). Ripgrep is used when available for extra safety.

---

## Environment and config sanity

```bash
i18nprune config --json
i18nprune doctor --only config,paths --json
```

Use before **`generate`** or **`fill`** in CI to catch missing **`rg`** or bad paths early.

---

## Catalog before generate

```bash
i18nprune languages --filter pt
i18nprune generate --target pt-br --dry-run
```

Ensures **`--lang`** matches the bundled catalog **before** calling translation APIs.

---

## Programmatic reuse (same logic as the CLI)

From a Node script:

```ts
import { resolveContext, scanProjectDynamicKeySites } from 'i18nprune/core';

const ctx = resolveContext();
const sites = scanProjectDynamicKeySites(ctx);
console.log(sites.length);
```

See **[Exports](../exports)** for the full **`core`** / **`config`** surface.

---

## See also

- [Command behaviors](../behavior/commands.md)
- [JSON & long runs](../behavior/json-long.md)
- [Policies](../config/policies)
