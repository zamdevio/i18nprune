# i18nprune — project analysis (agent onboarding)

This document gives coding agents a **single map** of the repository: what the product does, how code is layered, where to change behavior, and how work is sequenced. It is written as a **stable onboarding guide**; implementation details may evolve—verify with `src/` and `docs/commands/`.

---

## 1. Product summary

**i18nprune** is a **Node.js ≥ 18** CLI (TypeScript, ESM) that helps teams keep **i18n JSON** aligned with **source code** and **translation workflows**:

- **Correctness** — Literal translation keys referenced in application source are checked against a **source-of-truth locale JSON**.
- **Shape alignment** — Non-source locale files can be **merged and pruned** to match the source structure (with optional **preserve** rules).
- **Generation & fill** — Machine translation for **generate** and **fill** via a pluggable translator (e.g. Google `gtx` client).
- **Quality & review** — Reporting for parity, drift, and locale-vs-source comparisons.
- **Safety** — **Cleanup** of unused keys with optional **ripgrep** verification; confirmations for destructive operations where appropriate.
- **DX** — Structured **`--json`** on supported commands, global **verbosity** (`-q` / `-s`), **`doctor`** diagnostics, **`languages`** catalog listing.

The CLI is published as **`@zamdevio/i18nprune`**; local development uses **`pnpm`**, **`tsx`**, and **`vitest`**.

---

## 2. Repository layout (high level)

| Path | Role |
|------|------|
| `bin/cli.ts` | **Entry point** — Commander program, global flags, `preAction` (config resolution, `RunOptions`, banners), subcommand registration. |
| `src/commands/<name>/` | **Per-command orchestration** — Thin layers calling `core/` and `utils/`. |
| `src/core/` | **Domain logic** — Context, JSON operations, extraction, languages, translator, progress, errors, dynamic keys. |
| `src/config/` | **Config loading** — Resolve path, parse schema, `defineConfig`, `init` prompts. |
| `src/types/` | **TypeScript contracts** — Config, context, commands, runtime, logger, etc. |
| `src/utils/` | **Shared utilities** — Logger, ANSI/style, fs, rg, CLI helpers, report writer. |
| `src/constants/` | **CLI strings** — Docs URLs, JSON-output allowlist, etc. |
| `src/exports/` | **Library entrypoints** — `config`, `core` for programmatic use. |
| `docs/` | **Nextra-source markdown** — One `README.md` per topic; **`pnpm docs:sync`** copies to `nextra/content/`. |
| `tests/` | **Integration tests** (e.g. CLI against fixture app). |
| `tests/fixtures/sample-i18n-app/` | **Sample project** for manual and automated CLI checks. |
| `nextra/` | **Documentation site** app (install deps inside `nextra/` for dev). |

**Git hygiene:** Maintainer task ordering may live in repo-root **`CURRENT_PHASE.md`** (gitignored). **`docs/phases/`** is gitignored; **`nextra/scripts/sync-content.js`** skips copying `docs/phases` to the public site. Public direction stays in **`docs/roadmap/README.md`**.

---

## 3. Architecture (layers)

```
┌─────────────────────────────────────────────────────────┐
│  bin/cli.ts  (Commander, global flags, preAction)        │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  src/commands/*     src/config/*        src/argv/*
        │                   │                   │
        └───────────┬───────┴───────────────────┘
                    ▼
            src/core/context/
         (resolveContext, paths, run, meta)
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
 src/core/json   src/core/     src/core/
  merge/prune    extractor      translator
    path          scanner         + progress
                    │
                    ▼
              src/utils/logger
           (policy: info / detail / primary / …)
```

- **`Context`** bundles resolved **`config`**, absolute **`paths`** (`sourceLocale`, `localesDir`, `srcRoot`), **`run`** (`json`, `quiet`, `silent`), and **`meta`** (field provenance, warnings).
- **Commands** stay thin: parse options → `resolveContext()` → domain calls → **`printCommandSummary`** / human summaries / **`finalizeReportFile`** when applicable.

---

## 4. CLI surface (commands)

| Invocation | Purpose |
|------------|---------|
| `init` | Create config file when missing. |
| `config` | Print resolved config and env snapshot (`--json`). |
| `validate` | Literal keys in `src` vs source JSON; dynamic key warnings. |
| `sync` | Merge/prune locale JSON to source shape (`--lang`, `--dry-run`). |
| `generate` | Create/update target locale from source + MT. |
| `fill` | Re-translate leaves still matching source (`--lang` including `all` / lists). |
| `quality` | Parity / drift signals (policy-aware). |
| `review` | Locale vs source reporting (`--json`). |
| `cleanup` | Remove unused keys (rg safety, confirmations, `--check-only`). |
| `languages` | List catalog codes for `generate` / `fill`. |
| `locales` | `list`, `edit`, `dynamic`, `delete` subcommands. |
| `report` | Help topic for global `--report-file` / `--report-format`. |
| `doctor` | Environment diagnostics. |
| `help` | Styled help for any command. |

**Global flags** (see `bin/cli.ts`): `--config`, `--yes`, `--json`, `-q`/`-s`, path overrides, `--functions`, `--no-discovery`, `--report-file`, `--report-format`.

---

## 5. Configuration

- **Format:** `i18nprune.config.ts` / `.mts` / `.js` — **not** raw JSON on disk for the main config (JSON example files may exist as stubs only).
- **Schema:** Zod-validated (`src/config/schema.ts`) — `source`, `localesDir`, `src`, `functions`, optional `sourceLocaleCode`, `policies`, `reportFormat`.
- **Merging:** `defineConfig()` in `src/config/define.ts` merges user partial with defaults.
- **Resolution:** `src/config/resolve/` discovers config path, handles duplicates, `ensureConfig` for init flows.

---

## 6. Core pipelines (by concern)

### Validate

- Scan **`srcRoot`** for translation calls (`src/core/scanner`), extract literal keys (`src/core/extractor`), compare to string leaves in source JSON (`src/core/json/leaves`).
- **Dynamic keys:** `src/core/extractor/dynamic.ts` + `src/core/dynamic/index.ts` — non-literal first arguments; reported separately from missing literals.

### Sync

- `mergeToTemplateShape` / `pruneToTemplateShape` (`src/core/json/`) driven by source JSON as template.
- **`parseSyncLangSelection`** (`src/utils/cli/args.ts`) — default all non-source locales, or explicit list / `all`.

### Generate / fill

- **Translator** from `src/core/translator/init.ts`; **progress** via `src/core/progress/session.ts`.
- **Fill** loops locales when `--lang` is `all` or comma-separated; prompts use **`promptFillLanguageSelection`** for TTY.

### Cleanup

- Compute unused keys from source JSON vs usage in code; optional **rg** string checks; **preserve** policy; confirmation unless global **`--yes`** or non-interactive rules.

### Reports

- **`src/utils/report/index.ts`** — `pushReportEntry`, `finalizeReportFile`; formats **json** / **text** / **csv**; independent styling from interactive **`logger`** for file output.

---

## 7. Testing

- **Unit:** Vitest beside modules (e.g. `src/utils/cli/__tests__/args.test.ts`, `src/config/__tests__/`).
- **Integration:** `tests/integration/cli.fixture.test.ts` runs **`dist/cli.js`** against **`tests/fixtures/sample-i18n-app`** — requires **`pnpm run build`** first.
- **Policy:** Run **`pnpm typecheck`** and **`pnpm test`** before large merges; agents should do the same (see `docs/agents/rules.md`).

---

## 8. Documentation & site

- **Authoritative prose** lives under **`docs/`**; **`pnpm docs:sync`** mirrors into **`nextra/content/`**.
- **Per-command docs:** `docs/commands/<command>/README.md` — should stay in lockstep with `bin/cli.ts` and `src/commands/` (see **`docs/agents/git.md`**).
- **Behavior:** `docs/behavior/` — exit codes, JSON/long-run interaction.
- **Architecture:** `docs/architecture/` — ADRs, translator/progress, tree.

---

## 9. Extension points (planned or partial)

| Area | Intent |
|------|--------|
| **Translator providers** | Additional backends beside Google `gtx`; shared `translateLeaf` contract. |
| **Dynamic scanner** | More languages, comment stripping, per-file sites, **`locales dynamic`** richness. |
| **Patching** | Opt-in loader auto-patches (ADR 004); **`locales delete`** / **`locales edit`** hooks. |
| **Report coverage** | Extend **`pushReportEntry`** / **`finalizeReportFile`** to all long-running commands. |
| **Rich summaries** | Align human footers (`formatSectionTitle`) across **validate**, **review**, **quality**, etc. |

Treat these as **roadmap-aligned** work; confirm current code before implementing.

---

## 10. Conventions (short)

- **ESM** — Imports use **`.js`** suffix in TypeScript paths aligned with `tsconfig` / `tsup`.
- **Errors** — `I18nPruneError` with codes; `reportCliError` sets exit code.
- **Logging** — Never bypass **`canEmit`** gates; use **`logger`** with explicit **`RunOptions`** / **`ctx.run`**.
- **CLI** — Non-interactive and **`--json`** must not prompt where commands declare machine output (`src/constants/jsonoutput.ts`).

---

## 11. First tasks for a new agent

1. Read **`docs/agents/rules.md`** and **`docs/agents/git.md`**.  
2. Run **`pnpm install`**, **`pnpm typecheck`**, **`pnpm test`**, **`pnpm run build`**.  
3. Skim **`bin/cli.ts`** and one command (e.g. **`src/commands/validate/index.ts`**) end-to-end.  
4. Open **`docs/commands/README.md`** and the matching command doc.  
5. For feature work, follow the **commit plan** in **`docs/agents/git.md`** so history stays reviewable.

---

## 12. Related links

- [Contributors & agents README](./README.md)  
- [Git commit methodology](./git.md)  
- [Rules](./rules.md) · [Logging](./logging.md) · [Extraction](./extraction.md)  
- [Roadmap](../roadmap/README.md) · [Workflow](../workflow/README.md) · [CLI overview](../cli/README.md)
