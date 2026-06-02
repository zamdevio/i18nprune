# Maintainer onboarding

**Audience:** New contributors and coding agents.  
**Time budget:** ~45–90 minutes to be productive; ~half a day to ship a safe vertical slice.

User-facing docs live in **`docs/`** (synced to VitePress). This page is **maintainer-only** — it does not ship on [docs.i18nprune.dev](https://docs.i18nprune.dev).

---

## Mental model (read this first)

| Layer | Path | You change behavior here? |
|-------|------|---------------------------|
| **Engine** | `packages/core` | **Yes** — all domain logic, `runXxx`, cache, extractor, share |
| **CLI host** | `packages/cli` | Prompts, argv, `--json` envelope wiring, human output |
| **Report schema** | `packages/report` | Zod document shape for HTML/CSV reports |
| **Runtime UI** | `packages/ui` + `apps/web`, `apps/report`, worker `/docs` | Presentational only — see [`systems/ui.md`](../systems/ui.md) |
| **Share worker** | `apps/workers/i18nprune` | Hosted API + DO storage; metadata from **core** |
| **Meta worker** | `apps/workers/meta` | Separate metadata API; Swagger shell may reuse `@i18nprune/ui` |
| **Plans** | `maintainer/phases/` | **When** to work on what — not a substitute for code |
| **Maps** | `maintainer/systems/` | **How** subsystems are wired today |

**Golden rule:** If it decides i18n behavior, it belongs in **`packages/core`**, not the CLI.

---

## Day 0 — environment

```bash
pnpm install
pnpm typecheck    # all packages + ui:purity + worker compile gates
pnpm test         # unit + integration + parity
```

### Root scripts (quick reference)

| Script | What it does |
|--------|----------------|
| **`pnpm build`** | Production chain: CLI (+ embedded report), web, landing, docs, extension, both workers |
| **`pnpm typecheck`** | Full TS gate across core, cli, ui, apps, worker builds, extension webview |
| **`pnpm test`** | `vitest run` — all tests |
| **`pnpm test:summary`** | Same as test, grep summary lines only |
| **`pnpm knip`** | Dead code / unused exports / dependency hygiene |
| **`pnpm madge:circular`** | Import cycles in core, cli, report, ui |
| **`pnpm madge:orphans`** / **`pnpm madge:leaves`** | Optional dependency graph diagnostics |
| **`pnpm ui:purity`** | Forbidden imports in `@i18nprune/ui` (also in `typecheck`) |
| **`pnpm empty:dir`** / **`pnpm empty:file`** | List empty dirs/files (review before delete) |
| **`pnpm empty:dir:del`** / **`pnpm empty:file:del`** | Delete empties — **review listing first** |
| **`pnpm files`** / **`pnpm lines`** / **`pnpm stats`** | Count `.ts`/`.tsx` files and total LOC |

After moving files, renaming barrels, or adding workspace entries, also run **`pnpm madge:circular`** and **`pnpm knip`**.

---

## Day 0 — reading order (≈10 files)

Read in order; skip deep dives until you touch that area.

| # | Doc | Why |
|---|-----|-----|
| 1 | [`architecture.md`](./architecture.md) | Package topology, `runXxx`, core purity, parity |
| 2 | [`rules.md`](./rules.md) | TS, errors, logging, tests, commits |
| 3 | [`../phases/active-phase.md`](../phases/active-phase.md) | What sprint is active **right now** |
| 4 | [`../phases/shipped-slices.md`](../phases/shipped-slices.md) | Do not re-implement closed work |
| 5 | [`../systems/README.md`](../systems/README.md) | Where per-subsystem maps live |
| 5b | [`../systems/platform.md`](../systems/platform.md) | Multi-OS CLI/SDK — paths, home, WSL vs Windows |
| 6 | [`../systems/operations/entrypoints.md`](../systems/operations/entrypoints.md) | `runXxx` wiring table |
| 7 | `packages/cli/bin/cli.ts` | Global flags + command registration |
| 8 | One command end-to-end e.g. `packages/cli/src/commands/validate/` → `packages/core/src/validate/run.ts` | Host vs engine in practice |
| 9 | [`git.md`](./git.md) | Commit + PR discipline |
| 10 | [`../systems/health.md`](../systems/health.md) | Gates before every commit |

**UI rules:** [`../systems/ui.md`](../systems/ui.md) — domain boundaries and `pnpm ui:purity`.

---

## Day 1 — trace one command

Example: **`i18nprune validate --json`**

```txt
packages/cli/bin/cli.ts
  → packages/cli/src/commands/validate/run.ts        # orchestration
  → createCliCoreContext / Context
  → packages/core/src/validate/run.ts                # runValidate
  → packages/cli/src/commands/validate/jsonEnvelope.ts
  → buildCliJsonEnvelope (cwd: ctx.adapters.system.cwd())
```

**Frozen surfaces** (byte parity in `tests/parity/` for refactors):

- `--json` envelope shape
- Human stderr lines (sample fixture)
- Exit codes
- Issue codes in `packages/core/src/shared/constants/issueCodes.ts`

---

## Where to look by task

| Task | Start here |
|------|------------|
| New CLI flag on existing op | `packages/cli/src/commands/<op>/` + core `run.ts` |
| New issue code | `issueCodes.ts` + `docs/issues/README.md` + emitter |
| Config field | `packages/core/src/config/schema/` |
| Cache / incremental analysis | `packages/core/src/cache/` + [`systems/cache.md`](../systems/cache.md) + `docs/cli/cache.md` |
| Windows / macOS / path pitfalls | [`systems/platform.md`](../systems/platform.md) |
| Extractor / key sites | `packages/core/src/extractor/` + [`systems/extractor.md`](../systems/extractor.md) |
| Share (CLI, web, worker, core) | `packages/core/src/share/` + [`systems/share.md`](../systems/share.md) |
| Web workspace UX | `apps/web/src/` (domain stays in app; primitives in `packages/ui`) |
| Parity regression | `tests/parity/*.parity.test.ts` + `tests/fixtures/sample-i18n/__snapshots__/` |

---

## Host purity checklist

| Host | Allowed | Forbidden in engine |
|------|---------|---------------------|
| **Core** | `ctx.adapters`, passed `env` | `console.*`, `process.*`, direct `fs` |
| **CLI** | `process.*`, `console.log` for `--json` stdout | Business logic that belongs in `runXxx` |
| **Core JSON helpers** | `buildCliJsonEnvelope({ cwd })` when host passes cwd | `process.cwd()` inside `packages/core` |

CLI should pass **`cwd: ctx.adapters.system.cwd()`** via [`packages/cli/src/shared/result/envelopeCwd.ts`](../../packages/cli/src/shared/result/envelopeCwd.ts) (`cliEnvelopeCwd(ctx)`).

---

## Before you open a PR

- [ ] `pnpm typecheck && pnpm test`
- [ ] Touched CLI output? Run `pnpm vitest run tests/parity`
- [ ] Touched barrels / imports? `pnpm madge:circular` and `pnpm knip`
- [ ] Touched `packages/ui`? `pnpm ui:purity`
- [ ] Code + user docs together when behavior changes (`docs/commands/...`)
- [ ] Systems map updated when wiring changes (`maintainer/systems/...`)

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Logic in `packages/cli/src/commands/*/run.ts` beyond prompts/render | Move to `packages/core/src/<op>/run.ts` |
| Renaming an issue code | **Never** — codes are stable API |
| Importing `@i18nprune/core` from `packages/ui` | Keep component in app; pass props |
| Guessing phase scope | Read `active-phase.md` + hub doc; **ask** if ambiguous |
| Linking `maintainer/phases/*` from `maintainer/systems/*` for trackers | Systems = current wiring; phase files are ephemeral plans |

---

## Related

- [`README.md`](./README.md) — agents hub
- [`../README.md`](../README.md) — maintainer directory entry
- [`../phases/README.md`](../phases/README.md) — phase index
- [`../phases/active-phase.md`](../phases/active-phase.md) — current sprint focus
- [`../phases/final.md`](../phases/final.md) — one-time pre-publish checklist
