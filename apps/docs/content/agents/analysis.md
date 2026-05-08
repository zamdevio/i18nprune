# i18nprune — project analysis (agent onboarding)

This document gives coding agents a **single map** of the repository: what the product does, how code is layered, where to change behavior, and how work is sequenced. It is written as a **stable onboarding guide**; implementation details may evolve—verify with `packages/cli/src/` and `docs/commands/`.

---

## 1. Product summary

**i18nprune** is a **Node.js ≥ 18** CLI (TypeScript, ESM) that helps teams keep **i18n JSON** aligned with **source code** and **translation workflows**:

- **Correctness** — Literal translation keys referenced in application source are checked against a **source-of-truth locale JSON**.
- **Shape alignment** — Non-source locale files can be **merged and pruned** to match the source structure (with optional **preserve** rules).
- **Generation & fill** — Machine translation for **generate** and **fill** via a pluggable translator (e.g. Google `gtx` client).
- **Quality & review** — Reporting for parity, drift, and locale-vs-source comparisons.
- **Safety** — **Cleanup** of unused keys with optional **ripgrep** verification; confirmations for destructive operations where appropriate.
- **DX** — Structured **`--json`** on supported commands, global **verbosity** (`-q` / `-s`), **`doctor`** diagnostics, **`languages`** catalog listing.

The CLI ships as **`i18nprune`** on npm (engine **`@i18nprune/core`**); local development uses **`pnpm`**, **`tsx`**, and **`vitest`**.

---

## 2. Repository layout (high level)

| Path | Role |
|------|------|
| `packages/cli/bin/cli.ts` | **Entry point** — Commander program, global flags, `preAction` (config resolution, `RunOptions`, banners), subcommand registration. |
| `packages/cli/src/commands/<name>/` | **Per-command orchestration** — Thin layers calling `core/` and `utils/`. |
| `packages/cli/src/core/` | **Domain logic** — Context, JSON operations, extraction, languages, translator, progress, errors, dynamic keys. |
| `packages/cli/src/config/` | **Config loading** — Resolve path, parse schema, `defineConfig`, `init` prompts. |
| `packages/cli/src/types/` | **TypeScript contracts** — Config, context, commands, runtime, logger, etc. |
| `packages/cli/src/utils/` | **Shared utilities** — Logger, ANSI/style, fs, rg, CLI helpers, report writer. |
| `packages/cli/src/constants/` | **CLI strings** — Docs URLs, JSON-output allowlist, etc. |
| `packages/cli/src/exports/` | **Library entrypoints** — `config`, `core` for programmatic use. |
| `docs/` | **VitePress-source markdown** — One `README.md` per topic; **`pnpm docs:sync`** copies to `apps/docs/content/`. |
| `tests/` | **Integration tests** (e.g. CLI against fixture app). |
| `tests/fixtures/sample-i18n/` | **Sample project** for manual and automated CLI checks. |
| `apps/docs/` | **Documentation site** app — VitePress (install deps inside `apps/docs/` for dev). |

**Git hygiene:** Maintainer phase ordering lives in **`maintainer/phases/README.md`** (outside **`docs/`** — **not** copied to **`apps/docs/content/`**). Public direction stays in **`docs/roadmap/README.md`**.

---

## 3. Architecture (layers)

```
┌─────────────────────────────────────────────────────────┐
│  packages/cli/bin/cli.ts  (Commander, global flags, preAction)        │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  packages/cli/src/commands/*     packages/cli/src/config/*        packages/cli/src/argv/*
        │                   │                   │
        └───────────┬───────┴───────────────────┘
                    ▼
            packages/cli/src/core/context/
         (resolveContext, paths, run, meta)
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
 packages/cli/src/core/json   packages/cli/src/core/     packages/cli/src/core/
  merge/prune    extractor      translator
    path          scanner         + progress
                    │
                    ▼
              packages/cli/src/utils/logger
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
| `report` | Help topic for global `--json` plus shell redirection. |
| `doctor` | Environment diagnostics. |
| `help` | Styled help for any command. |

**Global flags** (see `packages/cli/bin/cli.ts`): `--config`, `--yes`, `--json`, `-q`/`-s`, path overrides, `--functions`, `--exclude`.

---

## 5. Configuration

- **Format:** `i18nprune.config.ts` / `.mts` / `.js` — **not** raw JSON on disk for the main config (JSON example files may exist as stubs only).
- **Schema:** Zod-validated (`packages/cli/src/config/schema.ts`) — required **`source`**, **`localesDir`**, **`src`**, **`functions`**; optional **`noLocaleMeta`**, **`policies`**, **``**, **`exclude`**, **`scanner`**, **`reference`**, **`localeLeaves`**, **`missing`**, **`patching`**, **`translate`**, etc. (**no** **`config.validate`** namespace today — **`validate`** follows CLI-only flags).
- **Merging:** `defineConfig()` in `packages/cli/src/config/define.ts` merges user partial with defaults.
- **Resolution:** `packages/cli/src/config/resolve/` discovers config path, handles duplicates, `ensureConfig` for init flows.

---

## 6. Core pipelines (by concern)

### Validate

- Scan **`srcRoot`** for translation calls (`packages/cli/src/core/scanner`), extract literal keys (`packages/cli/src/core/extractor`), compare to string leaves in source JSON (`packages/cli/src/core/json/leaves`).
- **Dynamic keys:** `packages/cli/src/core/extractor/dynamic/` (TS/JS provider, comment heuristics) + `packages/cli/src/core/extractor/dynamic/orchestrate.ts` — project scan, non-literal first arguments; reported separately from missing literals. See **`docs/dynamic/README.md`**.

### Sync

- `mergeToTemplateShape` / `pruneToTemplateShape` (`packages/cli/src/core/json/`) driven by source JSON as template.
- **`parseSyncLangSelection`** (`packages/cli/src/utils/cli/args.ts`) — default all non-source locales, or explicit list / `all`.

### Generate / fill

- **Translator** from `packages/cli/src/core/translator/init.ts`; **progress** via `packages/cli/src/core/progress/session.ts`.
- **Fill** loops locales when `--lang` is `all` or comma-separated; prompts use **`promptFillLanguageSelection`** for TTY.

### Cleanup

- Compute unused keys from source JSON vs usage in code; optional **rg** string checks; **preserve** policy; confirmation unless global **`--yes`** or non-interactive rules.

### Reports

- **`packages/cli/src/utils/report/index.ts`** — `pushReportEntry`, `finalizeReportFile`; formats **json** / **text** / **csv**; independent styling from interactive **`logger`** for file output.

---

## 7. Testing

- **Unit:** Vitest beside modules (e.g. `packages/cli/src/utils/cli/__tests__/args.test.ts`, `packages/cli/src/config/__tests__/`).
- **Integration:** `tests/integration/cli.fixture.test.ts` runs **`dist/cli.js`** against **`tests/fixtures/sample-i18n`** — requires **`pnpm run build`** first.
- **Policy:** Run **`pnpm typecheck`** and **`pnpm test`** before large merges; agents should do the same (see `docs/agents/rules.md`).

---

## 8. Documentation & site

- **Authoritative prose** lives under **`docs/`**; **`pnpm docs:sync`** mirrors into **`apps/docs/content/`**.
- **Per-command docs:** `docs/commands/<command>/README.md` — should stay in lockstep with `packages/cli/bin/cli.ts` and `packages/cli/src/commands/` (see **`docs/agents/git.md`**).
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
- **CLI** — Non-interactive and **`--json`** must not prompt where commands declare machine output (`packages/cli/src/constants/jsonoutput.ts`).
- **Issue code flow** — Add new machine issue codes in `packages/cli/src/constants/issueCodes.ts`, emit them via envelope builders/commands, and document each code in `docs/issues/README.md` (registry + dedicated section). Keep this triad in one change.
- **Multi-surface parity** — i18nprune ships one core behavior across CLI, JSON, report artifacts, and programmatic exports. Validate parity impact when changing core command behavior.

---

## 11. First tasks for a new agent

1. Read **`docs/agents/rules.md`** and **`docs/agents/git.md`**.  
2. Run **`pnpm install`**, **`pnpm typecheck`**, **`pnpm test`**, **`pnpm run build`**.  
3. Skim **`packages/cli/bin/cli.ts`** and one command (e.g. **`packages/cli/src/commands/validate/index.ts`**) end-to-end.  
4. Open **`docs/commands/README.md`** and the matching command doc.  
5. For feature work, follow the **commit plan** in **`docs/agents/git.md`** so history stays reviewable.

---

## 12. Related links

- [Contributors & agents README](.)  
- [Git commit methodology](./git.md)  
- [Rules](./rules.md) · [Logging](./logging.md) · [Extraction](./extraction.md)  
- [Roadmap](../roadmap) · [Workflow](../workflow) · [CLI overview](../cli)
