# Current handoff (local — gitignored)

Use this file to resume work after a break. **Do not rely on `docs/phases/` in git** — that folder is gitignored for the same reason (dev-only).

---

## Now → next (do in order)

### 1. Generate + `--json` safety (highest priority)

- [ ] **`canPromptGenerate` / `canPromptGenerate`-style checks** must treat **`ctx.run.json === true`** as non-interactive: **`i18nprune --json generate`** must never open Inquirer; fail fast if **`--lang`** is missing.
- [ ] **Interactive defaults** for meta prompts: catalog-backed **`default`** for **`promptMetaLocaleDetails`** when **`--lang`** is known.
- [ ] **RTL / direction:** either extend **`languages.json`** + catalog types with **`direction`**, or document **`--direction rtl`** as the non-interactive path only — pick one and align **`generate`** + user-facing docs.

**Files:** `src/commands/generate/index.ts`, `src/commands/generate/prompts.ts`, `src/utils/interactive/index.ts`, `docs/behavior/json-long.md`.

### 2. Dynamic keys (cross-cutting)

- [ ] Scanner: more source extensions, **comment stripping**, per-file paths for dynamic sites.
- [ ] **`locales dynamic`:** richer output; **`Commented`** vs used when comment-aware.

**Files:** `src/core/extractor/dynamic.ts`, `src/core/scanner/`, `src/commands/locales/dynamic.ts`.

### 3. Reports + UX parity

- [ ] **`pushReportEntry` / `finalizeReportFile`** on **`validate`**, **`review`**, **`quality`**, **`generate`** (where applicable).
- [ ] **Rich human footers** (same section style as **`sync`**) for commands above when not **`-q` / `-s`**.

**Files:** `src/utils/report/index.ts`, per-command `index.ts`.

---

## Quick commands

```bash
pnpm test && pnpm typecheck && pnpm run build
pnpm docs:sync   # after editing tracked files under docs/
```

---

## Recently shipped (trim over time)

- **Config centralization**: `CLI_NAME` + `CONFIG_BASE_NAME` now drives config filenames, prompts, banners, and docs across the tool.
- **Help + docs fallback**: `DOCS_SITE_BASE = ""` now forces clean GitHub links everywhere (root, commands, subcommands, `report`).

- **Programmatic exports overhaul** — rich JSDoc, dedicated `docs/exports/*.md` (config, core, examples), updated main README + package.json description.
- Centralised constants in `src/constants/cli.ts` (`CLI_NAME`, `CONFIG_BASE_NAME`, `CLI_MARK`, etc.) + config filename + help/docs fallback system.
- `src/utils/cli/args.ts`, **`sync` / `fill`** **`--lang`** (incl. **`all`**).
- Global **`--report-file`** / **`--report-format`**, **`utils/report`**, **`cleanup`** confirmations, **`locales delete`**, **`formatSectionTitle`**.
