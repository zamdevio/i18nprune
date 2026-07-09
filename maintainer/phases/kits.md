# Kits release — v0.1.5

**Status:** active sprint  
**Supersedes:** `KIT_ONLY_NEXT_RELEASE.md`, `IMPORTANT.md`, `PATH_ISSUE.md`, `CEPATEDGE_DYNAMIC_KEYS_REVIEW.md`, `NEXT_TASKS.md` (deleted — this file is the single tracker)

---

## Task tracker

Check off as each slice lands. One concern per PR where possible.

### Phase 0 — Release gates (block tag)

- [x] **0.1** Catalog `languages.json` writes to the correct path only (no home-dir / wrong-cwd writes when bundled CLI runs or `pnpm cli:build` triggers ensure)
- [x] **0.2** `loader_generated` emits `./`-prefixed relative ESM import paths in `localeLoaders` (fix `computeGeneratedModuleImportBase` + tests)
- [ ] **0.3** Kits dynamic-key messaging matches CepatEdge review gate (no “detected = complete” implication)
- [x] **0.4** npm `homepage` on `i18nprune` + `@i18nprune/core` → `https://docs.i18nprune.dev`

### Phase 1 — Native `i18nprune kits` command group

- [ ] **1.1** Register `kits` in `packages/cli/bin/cli.ts` with subcommands: `dynamic`, `identical`, `honest`, `baseline`, `pr`
- [ ] **1.2** Port logic from external kit `~/Tools/Kits/i18nprune/src/` into `packages/cli/src/commands/kits/`
- [ ] **1.3** Read-only safety: only analyze SDK ops (`runValidate`, `runDynamic`, `runQuality`, `runReview`) — no writes
- [ ] **1.4** Project root via global `-c/--config` (no `--cwd`; see [Decisions](#decisions))

### Phase 2 — UX contract

- [ ] **2.1** JSON minified by default when `-j`; pretty only when `-jp=true`
- [ ] **2.2** Human output: plain values; `chalk` on section labels only; respect `--no-color`; never color JSON
- [ ] **2.3** `--top` / `--full` (global `-T` / `-F`) affect terminal lists **and** `-sb` saved files
- [ ] **2.4** `-sb/--save-baseline <path>`: default `.md` (terminal-matching); with `-j` → `.json` minified unless `-jp=true`
- [ ] **2.5** No write-oriented flags inside kits (reporting/auditing surface only)
- [ ] **2.6** Per-subcommand `--help` + examples when args missing

### Phase 3 — Short flag aliases

- [ ] **3.1** `--json` → `-j`
- [ ] **3.2** `--json-pretty` → `-jp`
- [ ] **3.3** `--top` → `-T`
- [ ] **3.4** `--full` → `-F`
- [ ] **3.5** `--debug-scan` → `-ds`
- [ ] **3.6** `--debug-cache` → `-dc`
- [ ] **3.7** `--target` (per-command) → `-t`
- [ ] **3.8** `--out` (per-command) → `-o`
- [ ] **3.9** Do not break existing long-name or legacy aliases

### Phase 4 — Docs + verification

- [ ] **4.1** `docs/commands/kits/*.md` + `docs/commands/README.md` index row
- [ ] **4.2** CepatEdge E2E (mirror external `workflow.sh` against `apps/web`)
- [ ] **4.3** `pnpm typecheck` · `pnpm test` · `pnpm publish:verify`
- [ ] **4.4** Version bump `0.1.4` → `0.1.5` (root + `@i18nprune/core` + private `@i18nprune/cli`)
- [ ] **4.5** Close slice in `shipped-slices.md`; sync `apps/git/scripts/phases.config.json`
- [ ] **4.6** **Git timeline** — replace W26 `pre —` bullets in `apps/git/scripts/phases.config.json` with final kits v0.1.5 shipped items (required for `pnpm git:build` / deploy)

### Phase 5 — Post-tag (after v0.1.5 ships)

- [ ] **5.1** Delete external toolkit `~/Tools/Kits/i18nprune`
- [ ] **5.2** CepatEdge docs/maintainer: replace `Kits/i18nprune` → `i18nprune kits …`
- [ ] **5.3** Update baseline/pr saved-file examples (`.md` default, `-j` → `.json`, `-T`/`-F` on writes)

---

## Decisions

| Topic | Decision |
|-------|----------|
| Command name | **`kits`** (plural), not `kit` — `i18nprune kits dynamic …` (**locked** — agreed over external kit’s singular naming) |
| Project root | **Global `-c/--config`** only — no `--cwd`. Config path implies project root the same way native i18nprune already works. External kit’s `--cwd` is dropped on port. |
| Release scope | **Kits-only** for v0.1.5 — no extractor v2, AST tier, extension, or `search` in this tag |
| Post-release roadmap | Resume [`active-phase.md`](./active-phase.md) extractor → AST → extension after tag |

---

## Goal

Ship the external i18nprune toolkit (`~/Tools/Kits/i18nprune`) as **native CLI** commands with improved multi-format reports and safer automation.

Target UX:

```bash
i18nprune kits dynamic …
i18nprune kits identical …
i18nprune kits honest …
i18nprune kits baseline …
i18nprune kits pr …
```

Port source: `/home/amf/Tools/Kits/i18nprune` (delete after Phase 5).

---

## Relationship to other phase docs

| Doc | v0.1.5 |
|-----|--------|
| [`active-phase.md`](./active-phase.md) | **Paused** — extractor v2 / AST / extension resume after kits ships |
| Former `NEXT_TASKS.md` | AST tier + agent JSON pipes + PR surfaces → **after** kits; `kits pr` partially covers PR helper |
| [`extractor/cross-file.md`](./extractor/cross-file.md) | **Not in v0.1.5** — kits documents dynamic-key limits; does not resolve `i18nKey` tracing |

---

## Kits behavioral contract

1. **Default JSON is minified** when `-j` / `--json` is on; pretty only when `-jp` / `--json-pretty=true`.
2. **Human output stays readable** — plain result values; `chalk` on shared section labels only; `--no-color` respected; never color JSON.
3. **Listing limits affect saved baselines** — `-T`/`--top` and `-F`/`--full` control list contents in terminal **and** in files written by `baseline` / `-sb` flows.
4. **`-sb/--save-baseline`** writes the same format users see in the terminal: default **markdown** (`.md`); with `-j` → **JSON** (`.json`), minified unless `-jp=true`.
5. **Per-command help is self-contained** — missing args or `--help` shows that subcommand’s help + examples.
6. **No write-oriented flags inside kits** — reporting/auditing only; safe-by-default.

### Short-alias minimum (Phase 3)

| Long | Short |
|------|-------|
| `--json` | `-j` |
| `--json-pretty` | `-jp` |
| `--top` | `-T` |
| `--full` | `-F` |
| `--debug-scan` | `-ds` |
| `--debug-cache` | `-dc` |
| `--target` | `-t` |
| `--out` | `-o` |

Rules: don’t invent aliases for flags that don’t exist; don’t break existing aliases; long names keep working.

### External kit flags to preserve (kits-specific)

From `~/Tools/Kits/i18nprune` — port semantics, map to native naming:

| External | Native |
|----------|--------|
| `--cwd` | **dropped** — use `-c/--config` + cwd discovery |
| `--save-baseline` | `-sb/--save-baseline` |
| `--baseline` | `-b/--baseline` |
| `--fail-on` | `-fon/--fail-on` |
| `--max-dynamic` | `-mxdy/--max-dynamic` |
| `--contains` / `--focus` | per-subcommand filter flags |
| `--strict` | `--strict` (exit 2 on policy violations) |

---

## Gate 0.1 — Catalog `languages.json` path

**Problem:** `ensureLanguageCatalogFile()` runs on every CLI start (`packages/cli/bin/cli.ts`). When bundled into `dist/cli.js`, path resolution via `import.meta.url` in `scripts/catalog/paths.ts` can resolve incorrectly and write `languages.json` outside `packages/core/src/shared/languages/catalog/`.

**Required:**

- Catalog write function must **only** target the committed artifact: `packages/core/src/shared/languages/catalog/languages.json`
- If `pnpm cli:build` or global install triggers ensure, behavior must be correct or explicitly no-op outside dev
- Audit call chain: `ensure.ts` → `paths.ts` → `write.ts`; fix bundled vs source resolution

---

## Gate 0.2 — `loader_generated` import paths (`PATH_ISSUE`)

**Status:** open  
**Affects:** `patching.recipe: 'loader_generated'`  
**Reporter:** ShareVault (`apps/bot/i18nprune.config.ts`)

### Symptom

```ts
// ❌ Generated today
const localeLoaders = {
  en: () => import("locales/en.json"),
};

// ✅ Expected
const localeLoaders = {
  en: () => import("./locales/en.json"),
};
```

### Root cause

`computeGeneratedModuleImportBase()` in `packages/core/src/patching/io.ts` uses `path.relative()` which returns `locales/en.json` without a `./` prefix. TypeScript `NodeNext` and ESM treat bare `locales/…` as a package specifier.

### Fix location

- `packages/core/src/patching/io.ts` — normalize relative path to always start with `./` or `../`
- `packages/core/src/patching/generatedModule.ts` — if needed
- Tests: ShareVault-shaped config (`loaderPath: src/i18n/loaders.generated.ts`, `localeJsonImportBase: src/i18n/locales`)

### Rules

1. Resolve loader → locale as POSIX relative path (no leading `/`)
2. Always prefix `./` or `../` — never bare `locales/en.json`
3. Treat `localeJsonImportBase` as locale **directory**, rebase relative to `loaderPath`’s directory
4. Non-goals: absolute FS paths; bare package aliases unless explicitly configured

---

## Gate 0.3 — Dynamic-key messaging (CepatEdge review)

**Case:** CepatEdge Settings used `` t(`${SETTINGS}.title`) `` with `SETTINGS` from `i18nKey` registry. UI showed raw key paths; `validate` reported `missing=0`, `ok`.

**Why (0.1.4 behavior — kits must communicate honestly):**

| Command | What it actually checks |
|---------|-------------------------|
| `validate` | Literal `t('…')` keys only; dynamic sites → `dynamic_key_sites` warning |
| `missing` | Scaffolds literal keys only; empty `{}` scaffolds → “nothing to add” |
| `cleanup` | Unused = not proven by static scan; `copyPrefixes` protects dynamic areas |

**Kits must never imply:** traced `i18nKey.*` exports, auto-protected same-file `const NS`, or “validate ok” = all dynamic leaves have string values.

**Consumer workflow kits should reinforce:**

1. Add `copyPrefixes` for dynamic prefix areas
2. `i18nprune kits dynamic --full` (or `locales dynamic`) to list call sites
3. Author real strings in source locale — not empty scaffolds
4. `cleanup --dry-run` → `wouldRemove: 0`

**Upstream (post-v0.1.5):** cross-file resolution (`extractor/cross-file.md`), finite-keys inference, empty-scaffold quality rule.

### Key CepatEdge paths (reference)

| Path | Role |
|------|------|
| `apps/web/i18nprune.config.ts` | `copyPrefixes`, `reference.defaults` |
| `apps/web/src/i18n/keys.ts` | `i18nKey` registry |
| `apps/web/src/domains/shared/pages/settings/index.tsx` | 35 dynamic `` t(`${SETTINGS}.…`) `` sites |
| `apps/web/locales/en.json` | Source locale |

---

## Gate 0.4 — npm homepage

Both published packages currently have empty `homepage` on npm (0.1.4).

Add to root `package.json` (`i18nprune`) and `packages/core/package.json` (`@i18nprune/core`):

```json
"homepage": "https://docs.i18nprune.dev"
```

Verify after publish: `pnpm view i18nprune homepage` · `pnpm view @i18nprune/core homepage`

---

## Subcommand reference (port from external kit)

### `kits dynamic`

Dynamic call-site report — groups, file:line samples, policy gates.

```bash
i18nprune kits dynamic -c i18nprune.config.ts -F -j
i18nprune kits dynamic --contains settings/index -T 200
i18nprune kits dynamic -fon dynamic -mxdy 80
```

### `kits identical`

Source-identical leaf paths (reads source + target locale files; supports `{ value }` structured leaves). Default applies `policies.parity` excludes; `--raw` for unfiltered.

```bash
i18nprune kits identical -j
i18nprune kits identical -T 50 --raw
i18nprune kits identical --strict
```

### `kits honest`

Combined signal: validate + dynamic + quality + review.

```bash
i18nprune kits honest -j
i18nprune kits honest --focus settings/index -T 20 --strict
i18nprune kits honest -sb .i18n-baseline.md
```

### `kits baseline`

Signal snapshot + compare delta.

```bash
i18nprune kits baseline -sb .i18n-baseline.md
i18nprune kits baseline -b .i18n-baseline.json -j
```

### `kits pr`

PR comment / CI markdown (default human output).

```bash
i18nprune kits pr --focus settings/index -T 10
i18nprune kits pr -j -o /tmp/i18n-pr.json
i18nprune kits pr -T 3 -sb pr.md
```

---

## Implementation map

| Area | Path |
|------|------|
| CLI registration | `packages/cli/bin/cli.ts` |
| Kits commands | `packages/cli/src/commands/kits/` (new) |
| Port from | `~/Tools/Kits/i18nprune/src/*.ts`, `lib/*` |
| Global flags / aliases | `packages/cli/bin/cli.ts`, `packages/cli/src/argv/` |
| JSON defaults | `packages/core/src/shared/options/runOptions.ts`, `cli.ts` preAction |
| Patching fix | `packages/core/src/patching/io.ts` |
| Catalog fix | `scripts/catalog/paths.ts`, `ensure.ts` |
| Docs | `docs/commands/kits/` |

---

## Definition of done (v0.1.5)

- [ ] `i18nprune kits` subcommands work end-to-end per contract above
- [ ] Gates 0.1–0.4 satisfied
- [ ] Short-alias coverage (Phase 3 minimum)
- [ ] Published packages have `homepage`
- [ ] Phase 5 deferred until after tag

---

## Execution order

```text
Phase 0 (gates) → Phase 1 (scaffold + port) → Phase 2 (UX) → Phase 3 (aliases)
  → Phase 4 (docs + E2E + publish) → tag v0.1.5 → Phase 5 (cleanup)
```

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-09 | Created from consolidated release docs; command renamed `kit` → `kits`; `--cwd` → `-c/--config` |
