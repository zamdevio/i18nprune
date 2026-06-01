# Docs refactor phase

Status: Planned (scoped for v1 — Session D in [`V1-RELEASE.md`](./V1-RELEASE.md)) · **After:** [`cross-platform.md`](./cross-platform.md) (XP) and [`tree.md`](./tree.md).

This phase defines how to evolve docs into a clear, official-quality product site. **v1 scope** includes **dual-audience onboarding** (users + contributors), nav reduction (~10 categories), README rewrite, SDK quickstart, and tree flattening. Full topology linkage sweeps and repository health docs splits are deferred post-v1.

**Why onboarding lives here (not a separate phase):** onboarding is published docs + information architecture. Maintainer depth already lives in [`maintainer/agents/onboarding.md`](../agents/onboarding.md). A second phase would split nav design from the entry points nav must promote.

## Why this phase exists

The docs tree has grown quickly during major architecture work. It now needs a dedicated cleanup pass so:

- navigation stays simple and discoverable,
- topology pages become first-class entry points,
- content quality is consistent across commands/config/behavior,
- future sessions can reference one docs refactor source instead of many small checklist bullets.

## Scope

In scope:

- **Dual-audience onboarding** — one public hub for users (CLI / SDK / CI / hosted) + a clear contributor entry that links to maintainer onboarding on GitHub (not mirrored into VitePress).
- Information architecture cleanup for `docs/**`.
- Topology discoverability integration across related docs pages.
- Content quality standards for command/config/behavior/SDK pages.
- SDK documentation IA: public `docs/sdk/**` entry point and sub-pages for programmatic use of `@i18nprune/core`.
- Repository health documentation: public architecture-health page plus maintainer policy page for Knip/Madge tradeoffs.
- Diagram workflow policy (maintainer source + published assets).
- Release/readiness checks for docs structure quality.
- **`docs/issues/**`:** shared catalog layout (`common.md` + topic pages), parity with **`issueCodes.ts`**, and per-code rewrite quality (see execution slice 8 below).

Out of scope:

- command behavior changes,
- public contract changes (`--json` envelope, issue codes, exit behavior),
- maintainer planning structure changes outside docs policy alignment.

## Public/internal boundary (locked)

- `docs/**` is public and published.
- `maintainer/**` is internal planning and source-of-truth for in-flight sequencing.
- Diagram source files live in `maintainer/diagrams/**`.
- Published diagram assets used by docs pages live under `apps/docs/.vitepress/public/**`.

## Naming and IA decisions

### Keep `docs/commands/` (do not rename to `docs/operations/`)

Rationale:

- better user mental model (`i18nprune <command>`),
- stronger SEO/search discoverability,
- lower migration cost for existing links.

### Topology page naming (minimal)

Under `docs/architecture/topology/`:

- `overview.md`
- `translation.md`
- `runtime.md`
- `provider.md`

Optional future pages:

- `patching.md`
- `json.md`

### SDK docs naming

Public docs should use **SDK** as the user-facing concept, while the real package/import name remains **`@i18nprune/core`** and the source tree remains **`packages/core`**.

Rationale:

- `core` is the correct implementation name for the runtime-agnostic engine shared by CLI, SDK consumers, docs examples, and future hosts.
- `SDK` is the clearer user-facing docs label for developers calling APIs directly.
- Renaming `packages/core` / `@i18nprune/core` to `sdk` would create large codebase churn without improving the current API contract.
- Public docs can explain this plainly: "The i18nprune SDK APIs are exported from `@i18nprune/core`."

### Import naming convention (locked)

There are two published packages with different import paths. Docs must never confuse them.

**`@i18nprune/core`** (with `@`) — the standalone SDK package:

```ts
import { createCoreContext, runGenerate } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
```

- Installed via `npm install @i18nprune/core`.
- Full SDK surface: all `runXxx` entries, context builders, runtime adapters, types.
- Subpath exports per op (`/generate`, `/sync`, `/validate`, …) and per runtime (`/runtime/node`, `/runtime/web`, `/runtime/edge`).
- **Use in:** SDK docs, programmatic usage pages, examples, architecture pages.

**`i18nprune/core`** (without `@`) — subpath export bundled with the CLI:

```ts
import { defineConfig } from 'i18nprune/core';
```

- Available automatically when `i18nprune` (the CLI) is installed.
- Subset surface: primarily `defineConfig` + types for `i18nprune.config.ts` files.
- **Use in:** config docs only — when showing how to write `i18nprune.config.ts`.

**Rules for docs:**

- SDK pages → always `@i18nprune/core` (with `@`).
- Config pages → `i18nprune/core` (without `@`) for `defineConfig` only.
- Never mix both on the same page — pick one audience (SDK consumer vs CLI user).
- Code examples must use the correct import path for their audience.

### SDK docs planned shape

- `docs/sdk/README.md` — official SDK entry page, with an index of sub-pages.
- `docs/sdk/quickstart.md` — shortest path to `create*Context` + `run*`.
- `docs/sdk/runtime-adapters.md` — Node/Web/Edge adapters, explicit `env`, no runtime defaults in core.
- `docs/sdk/operations.md` — which entry to call (`runTranslate`, `runGenerate`, `runSync`, future ops).
- `docs/sdk/json.md` — `{ payload, issues }`, CLI envelopes, issue codes, and error handling.
- `docs/sdk/programmatic.md` — direct SDK usage patterns currently split across `docs/json/programmatic.md` and `docs/exports/**`.
- `docs/sdk/examples/README.md` — pointers to runnable `examples/sdk/**`.

Migration rule:

- Do **not** delete `docs/exports/**` until `docs/sdk/**` has equivalent or better coverage and inbound links have been moved.
- Do **not** delete `docs/json/**` until CLI JSON envelope docs and programmatic SDK guidance have been moved or redirected:
  - CLI JSON contract → `docs/sdk/json.md` (or a command/output page if that reads better during the slice).
  - `docs/json/programmatic.md` → `docs/sdk/programmatic.md`.
- Once `docs/sdk/**` is stable, retire `docs/exports/**` in a dedicated docs-only slice (delete or short redirect-style pointer, depending on docs-site link behavior).
- Once SDK JSON/programmatic docs are stable, retire `docs/json/**` in a dedicated docs-only slice (delete or short redirect-style pointer, depending on docs-site link behavior).

## Dual-audience onboarding (priority — do before nav trim)

**Goal:** A single **legendary entry** on the docs site: visitors pick a persona in under 10 seconds and land on a complete path — not a wall of index links.

### Audiences (locked)

| Persona | Wants | Public entry | Deep dive (do not duplicate) |
|---------|--------|--------------|------------------------------|
| **CLI user** | Install, config, day-to-day commands | `docs/onboarding/cli.md` | [`commands/`](../../docs/commands/README.md), [`config/`](../../docs/config/README.md) |
| **SDK integrator** | `@i18nprune/core`, adapters, `runXxx` | `docs/onboarding/sdk.md` → `docs/sdk/quickstart.md` | `docs/sdk/**`, `examples/sdk/**` |
| **CI / automation** | `--json`, exit codes, stable issue codes | `docs/onboarding/ci.md` | [`behavior/`](../../docs/behavior/README.md), [`issues/`](../../docs/issues/README.md), [`examples/`](../../docs/examples/README.md) |
| **Hosted surfaces** | Report app, share links, web workspace | `docs/onboarding/hosted.md` | [`report/`](../../docs/report/README.md), [`commands/share/`](../../docs/commands/share/README.md), [`runtime/worker.md`](../../docs/runtime/worker.md) |
| **Contributor / agent** | Clone repo, PR discipline, core vs CLI | [`contributors/`](../../docs/contributors/README.md) | [`maintainer/agents/onboarding.md`](../agents/onboarding.md) (GitHub link only on public site) |

### Hub page (`docs/onboarding/README.md`)

Replace the current “60 seconds only” page with a **chooser hub**:

1. **What is i18nprune?** — one paragraph (problem, not feature table).
2. **Pick your path** — four cards/links: CLI · SDK · CI · Hosted (+ fifth: Contribute).
3. **Fastest win** — keep the existing validate `--json` snippet as “try now” (below the chooser, not instead of it).
4. **Surfaces matrix** — small table: npm CLI · `@i18nprune/core` · report.i18nprune.dev · workers.i18nprune.dev · future extension.

**Tone:** plain language, `docs/` links only, no `maintainer/` URLs in body copy (contributor path may use the existing GitHub link pattern from [`contributors/README.md`](../../docs/contributors/README.md)).

### Path pages (new or expanded)

| Page | Minimum sections |
|------|------------------|
| **`cli.md`** | Install → `init` / config → `validate` → `sync` → `generate` / `missing`; link config + cache flags |
| **`sdk.md`** | When to use SDK vs CLI; install `@i18nprune/core`; pointer to quickstart + runtime adapters + operations index |
| **`ci.md`** | `validate --json` gate; `jq -e '.ok'`; issue codes; parity expectations; link jq cookbook |
| **`hosted.md`** | Report import/share; worker URL; web workspace `/#/workspace?id=`; what runs locally vs on edge |

Each path page ends with **What to read next** (3–5 links max).

### Contributor onboarding (public vs maintainer)

| Layer | Location | Role |
|-------|----------|------|
| **Public** | `docs/contributors/README.md` | Fork/PR, `pnpm typecheck` / `pnpm test`, layer table, link to GitHub `maintainer/agents/onboarding.md` |
| **Maintainer** | `maintainer/agents/onboarding.md` | Day 0 env, reading order, trace-a-command, share/cache boundaries, PR checklist |

**Slice work:** refresh `contributors/README.md` so it matches the hub’s “Contribute” card; add a short “New to the codebase?” block that mirrors the maintainer reading-order table without copying the full doc.

### Navigation / sidebar (after hub exists)

Update `apps/docs/.vitepress/sidebar.ts` **Start** group:

```txt
Start
├── Documentation home
├── Onboarding (hub)
│   ├── CLI path
│   ├── SDK path
│   ├── CI path
│   ├── Hosted surfaces
│   └── Contributors
└── …
```

Fold redundant “Start” links only after the hub is live (avoid two competing entry points).

### Acceptance (onboarding slice done when)

- [ ] Hub + four path pages + contributors refresh merged.
- [ ] `docs/README.md` index row points to hub as primary entry (not only “60 seconds”).
- [ ] Sidebar **Start** group lists path pages under Onboarding.
- [ ] No new `maintainer/` links inside VitePress body pages.
- [ ] `pnpm docs:sync` + VitePress build pass.

---

### Keep `docs/report/README.md` (report web app + cross-links)

- **Do not delete** `docs/report/README.md`, and avoid relocating or renaming it during tree flattening unless every consumer is updated in the same change.
- **Rationale:** **[report.i18nprune.dev](https://report.i18nprune.dev)** (`apps/report`) and embedded report flows treat this file as the canonical **Report UI** doc (SPA behavior, payload contract, troubleshooting). It is also linked from **`packages/report`**, **`apps/report`**, **`docs/commands/report/README.md`**, **`docs/report/payload.md`**, and workspace/landing doc URLs (`report/README`).
- Treat it like command reference docs: improve in place rather than folding it away for “nav minimalism.”

## Docs tree minimization rules

Use these rules during refactor; do not force all moves in one PR.

1. If a directory contains only one `README.md` and no sibling pages/assets, consider flattening to `<topic>.md` (**exception:** keep **`docs/report/README.md`** at this path — see the **Keep `docs/report/README.md`** subsection above).
2. Keep directory `README.md` only when there are sibling sub-pages needing an index.
3. Avoid adding new top-level folders unless they contain at least 2-3 durable pages.
4. Prefer cross-links over duplicate prose.
5. Keep command docs as command-first pages; architecture/system flow belongs in topology pages.

## Topology discoverability pattern

Related pages should include a short architecture/topology section using this pattern:

```md
## Architecture

See:
- Topology: Translation
- Topology: Runtime
- Topology: Provider
```

Apply to:

- `docs/commands/*` pages related to translation/provider/runtime behavior,
- `docs/config/*` where settings affect topology-level behavior,
- `docs/behavior/*` where runtime/output policy is explained.

## "Official docs site" quality standard

Each public page should target this minimum structure:

1. What this page is for
2. When to use it
3. Core concepts / contract
4. Practical examples
5. Troubleshooting / edge cases (or link)
6. Related pages (including topology links when relevant)

Quality checks:

- concise headings,
- no stale internal-path assumptions in public docs,
- no maintainer-only references as clickable public links.

## Repository health docs split

The Madge / Knip story belongs in both public docs and maintainer docs, with different framing.

Public docs should document the **result / confidence contract**, not the implementation churn:

- dependency graph health,
- no circular dependency guarantee,
- export/dependency hygiene,
- explicit package boundaries,
- runtime layering and isolation,
- how graph checks support SDK / CLI / app confidence.

Candidate public page:

- `docs/architecture/repository-health.md`

Maintainer docs should document the **why / maintenance policy**:

- Knip entry/ignore rationale,
- why SDK examples and intentional public barrels are treated specially,
- how to handle false positives,
- workspace dependency declaration policy (`workspace:*` internally, semver externally after publish),
- Madge command policy and future tightening goals,
- when leaves/orphans are healthy entry surfaces vs dead-code signals.

Candidate maintainer page:

- `maintainer/systems/repository-health.md`

Public docs say: "the system validates and maintains X." Maintainer docs say: "here is how we keep X true, and which tradeoffs are intentional."

## Candidate IA consolidation map (planning only)

These are candidates to evaluate during the phase, not mandatory immediate moves:

- `docs/json/**` may be reduced to a smaller sub-page set if overlap is high.
- `docs/exports/**` should be folded into `docs/sdk/**` once SDK docs are stable; keep it as a compatibility/source page until then.
- small single-file directories across `docs/**` may be flattened where rule #1 applies.
- topology links should be added to major command/config/behavior pages before any large folder moves.
- **`docs/cli/cache.md`:** relocate and rewrite (see **Project disk cache documentation** below); do not leave long-lived cache engine prose under **`docs/cli/`** once core ownership is reflected in docs.

Any move must preserve:

- stable internal links,
- docs site sidebar coherence,
- migration notes for renamed paths.

## Project disk cache documentation (planned)

**Current gap:** `docs/cli/cache.md` is titled like CLI-only docs and cites **`packages/cli/src/shared/cache/paths.ts`** and **`packages/cli/src/shared/cache/dispatch.ts`**. The **authoritative** on-disk cache layout, validation, and report-cache orchestration live under **`packages/core/src/cache/**`**. The CLI still owns **user-facing flags** (`--no-cache`, `--debug-cache`), **logger diagnostics**, and **host wiring** into core — public docs should describe that boundary.

**Planned work (see execution slice 9):**

1. **Accuracy pass:** replace stale paths and symbols with the **current** tree (inventory during the slice: e.g. `packages/core/src/cache/dispatch.ts`, `setup/paths.ts`, `engine.ts`, `io/*`, `packages/core/src/types/cache/**`, plus any remaining thin CLI shims under `packages/cli/src/shared/cache/` that only delegate).
2. **Relocate:** move the long-form page **out of `docs/cli/`**; keep **`docs/cli/README.md`** to a **one-line pointer** to the canonical page.
3. **Canonical URL — TBD when implementing:** pick one home in the same PR as sidebar + link updates, for example:
   - **`docs/cache/README.md`** — product-facing hub (layout under `~/.i18nprune/cache/`, clearing, relationship to **`report`**),
   - **`docs/architecture/cache.md`** — layering (core engine vs CLI host),
   - **`docs/behavior/cache.md`** — emphasize global flags and bypass semantics,
   - **`docs/sdk/…`** — only if the primary audience is programmatic / adapter contracts.
4. **Inbound link sweep:** `docs/cli/README.md`, **`docs/performance/**`**, **`docs/commands/report/**`**, versioning cross-refs, and any architecture pages that mention old cache paths.

**Non-goals for this slice:** no on-disk format or runtime behavior changes — documentation and IA only.

## Execution slices (recommended)

**Order note:** run **slice 0 (onboarding)** before **slice 4 (navigation polish)** so the trimmed nav promotes the new entry points.

0. **Onboarding hub + paths (dual audience)**
   - Implement **Dual-audience onboarding** above: hub, `cli` / `sdk` / `ci` / `hosted` paths, contributors refresh.
   - Align root [`docs/README.md`](../../docs/README.md) lede with the hub.
1. **Topology linkage sweep**
   - Add architecture/topology sections to related command/config/behavior pages.
2. **Template normalization**
   - Align major pages with the quality standard sections above.
3. **IA flattening pass**
   - Apply minimization rules to low-value single-file directories.
4. **Navigation polish**
   - Ensure docs index and architecture hubs reflect final topology-first navigation.
5. **SDK docs consolidation**
   - Add `docs/sdk/README.md` and sub-pages.
   - Move durable programmatic/API guidance from `docs/exports/**` and `docs/json/programmatic.md` into SDK docs.
   - Move CLI JSON/programmatic material out of `docs/json/**` into `docs/sdk/json.md` and `docs/sdk/programmatic.md`; retire `docs/json/**` after equivalent coverage and links exist.
   - Keep `@i18nprune/core` import names in code samples while presenting the section as the i18nprune SDK.
6. **Repository health docs**
   - Add public `docs/architecture/repository-health.md` focused on guarantees and contributor confidence.
   - Add maintainer `maintainer/systems/repository-health.md` focused on Knip/Madge policy, ignores, barrels, examples, leaves/orphans, and future tightening.
7. **Release validation**
   - run docs build and architecture graph checks.
8. **`docs/issues/**` catalog and quality pass** (dedicated slice; can land after IA/SDK work)
   - **Split shared vs command-specific codes:** add **`docs/issues/common.md`** as the home for cross-cutting issue codes (examples: `i18nprune.project.*` from workspace readiness, locales source/target patterns shared by multiple commands, and any other codes that are not tied to a single subcommand). Keep existing **`docs/issues/<topic>.md`** pages for codes that belong to one command or domain only; link from topic pages into **`common.md`** where a code is shared.
   - **Inventory parity with `issueCodes.ts`:** before closing the slice, reconcile **`packages/core/src/shared/constants/issueCodes.ts`** (and the CLI mirror if present) with **`docs/issues/**`**. Every emitted code should either (a) be documented under **`docs/issues/**`** (including **`common.md`**), or (b) be removed from **`issueCodes.ts`** if it is genuinely dead and never emitted. Prefer documenting real codes over deleting; delete only after proving no emission path (core, CLI, tests, parity fixtures).
   - **Rewrite standard per code:** each documented issue should have a consistent structure: what triggered it, **what to change and where** (config paths, files, flags), and—when applicable—**which `i18nprune` subcommands or flags** address or narrow the problem. For CLI-guided fixes, briefly state what running that command does (read-only vs writes, scope) so users can choose safely.
9. **Project disk cache — relocate + refresh** (docs-only; standalone or batched with IA / navigation polish)
   - Execute **Project disk cache documentation (planned)** above: rewrite for **`packages/core/src/cache/**`**, move off **`docs/cli/cache.md`**, choose **canonical path TBD** at slice time, update **`apps/docs/.vitepress/sidebar.ts`**, and fix inbound links.

## Validation / release gates for this phase

- `pnpm docs:sync`
- docs site build (`apps/docs` VitePress build path)
- run Madge checks documented in `docs/madge/README.md` before release tagging
- verify no broken links introduced by IA moves

## Relationship to v1 sessions

Sessions A-D may land architecture changes that require topology updates.
This phase is the docs-side companion and should be referenced whenever:

- core/CLI ownership boundaries move,
- provider/runtime flows change,
- command behavior docs need re-linking to topology pages.
