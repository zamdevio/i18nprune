# Agents & contributors

Guides for humans and coding agents working in this repo.

| Page | What it covers |
|------|----------------|
| [**Architecture**](./architecture.md) | Package topology, core purity, `runXxx` pattern, type/barrel layout, import discipline, health gates, cross-surface parity |
| [**Rules**](./rules.md) | TypeScript, output contract, error handling, testing, logging, non-interactive safety, commit discipline |
| [**JSDoc**](./jsdoc.md) | When/where/how to write JSDoc across core, CLI, and apps |
| [**Git**](./git.md) | Commit style, version alignment, **git tags**, **npm publish** (`i18nprune` + `@i18nprune/core`) |
| [**Health gates**](../systems/health.md) | `typecheck`, `test`, knip, madge, `ui:purity`, `publish:verify`, `empty:*` |
| [**Onboarding**](./onboarding.md) | First-day reading order, trace-a-command, PR checklist, host purity |
| [**Platform (multi-OS)**](../systems/platform.md) | Windows / macOS / Linux / WSL — adapters, CLI home, CI matrix |
| [**Share ecosystem**](../systems/share.md) | Core `runShare*`, CLI/web/report, `workers/i18nprune` API |
| [**Runtime UI kit**](../systems/ui.md) | `@i18nprune/ui` domain boundaries, purity rules, enforcement |
| [**Knip config**](../systems/knip.md) | `knip.json` ignore catalog (barrels, edge entries, type-only deps) |

---

## Onboarding (first steps)

**→ Full guide:** [`onboarding.md`](./onboarding.md)

1. Read [`onboarding.md`](./onboarding.md) (reading order + trace-a-command).
2. Run `pnpm install`, `pnpm typecheck`, `pnpm test`.
3. Check the active sprint: [`maintainer/phases/active-phase.md`](../phases/active-phase.md).
4. Before re-implementing a feature, scan [`shipped-slices.md`](../phases/shipped-slices.md).
5. Follow [`git.md`](./git.md) for commits; use its **publish / tag checklist** before npm release.

---

## Repo layout (agent mental model)

| Layer | Path | Notes |
|-------|------|--------|
| **Engine** | `packages/core` | All `runXxx`, cache, extractor, share; **report Zod schema** in `src/shared/report/` → `@i18nprune/core/report-schema` |
| **CLI host** | `packages/cli` | argv, prompts, `--json` envelope — no duplicated domain logic |
| **Runtime UI** | `packages/ui` + `apps/web`, `apps/report`, worker `/docs` | Presentational only — see [`systems/ui.md`](../systems/ui.md) |
| **Report SPA** | `apps/report` | npm name `@i18nprune/report`; consumes core report payloads + schema subpath |
| **Extension (next)** | `apps/extension` | Planned post-v1 — [`phases/extension/README.md`](../phases/extension/README.md) |
| **Plans** | `maintainer/phases/` | **When** to work on what |
| **Maps** | `maintainer/systems/` | **How** subsystems wire today |

Report **schema** lives only in **`packages/core`** (`@i18nprune/core/report-schema`) — not a separate `packages/` schema package.

---

## Docs site (VitePress)

`docs/` is synced into `apps/docs/content/`. When adding, renaming, or removing a markdown page that should appear in the nav, update `apps/docs/.vitepress/sidebar.ts` in the same change.

**Audience and tone:** treat `docs/**` as **end-user documentation** (public site). Prefer plain language, config- and behavior-focused explanations, and links to other `docs/` pages. Avoid maintainer roadmap language (sessions, phases, “shipped” checklists), avoid `maintainer/` paths in prose unless there is no user-safe alternative, and avoid deep internal file paths unless they genuinely help readers (otherwise point contributors to `maintainer/systems/` or the repo). Roadmaps, subsystem maps, and agent-only checklists belong under `maintainer/`.

---

## Where things live

| Need | Location |
|------|----------|
| Active plans | `maintainer/phases/active-phase.md` |
| Shipped receipts | `maintainer/phases/shipped-slices.md` |
| System maps | `maintainer/systems/` |
| Scratch / spikes | `maintainer/temp/` (gitignored) |
| User-facing docs | `docs/` |
| SDK examples | `examples/sdk/` |
| Publish verification | `pnpm run publish:verify` · `tests/publish-types/` |
