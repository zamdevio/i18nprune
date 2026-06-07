---
description: "These recipes combine global flags, policies, and multiple commands the way teams use i18nprune in real projects: CI, batch translation, and safe cleanup…"
---

# Examples — advanced CLI workflows

These recipes combine **global flags**, **policies**, and **multiple commands** the way teams use **i18nprune** in real projects: CI, batch translation, and safe cleanup. Adjust paths to your repo.

Per-command examples now live directly inside each command doc under `docs/commands/**`.  
SDK runnable examples: [SDK examples](./sdk.md).
JSON shaping snippets: [jq cookbook](./jq-cookbook.md).

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

Write a **single artifact** after supported commands (sync, generate, cleanup, …):

```bash
i18nprune sync --dry-run stdout redirection ./artifacts/sync-report.json
i18nprune generate --resume --all --dry-run stdout redirection ./artifacts/resume.txt --format text
```

Default format is **`json`**; override with **`--format`** or **``** in config. Use for **audits** and **dashboards** without parsing stdout.

---

## Sync all locales, then resume stale source-identical strings

```bash
i18nprune sync --target all
i18nprune generate --resume --all
```

**`--target all`** / **`--all`** (with **`--resume`**) walk non-source locales under **`localesDir`**. Use **`--dry-run`** first on **`generate --resume`** to estimate API usage.

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

Use before **`generate`** or **`generate --resume`** in CI to catch missing **`rg`** or bad paths early.

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

See **[SDK operations](../sdk/operations.md)** for the current programmatic surface.

---

## See also

- [CLI prompts](../cli/prompts.md)
- [JSON output (`--json`)](../cli/json.md)
- [Policies](../config/policies.md)
