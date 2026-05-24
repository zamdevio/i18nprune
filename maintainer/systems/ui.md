# Runtime UI kit (`@i18nprune/ui`)

**Audience:** Maintainers and agents touching `packages/ui`, `apps/web`, `apps/report`, or worker `/docs` presentation.  
**Audience is not:** end users (`docs/`).  
**Companion:** [`maintainer/agents/architecture.md` § 11](../agents/architecture.md#11-ui-domains) · [`packages/ui/README.md`](../../packages/ui/README.md) · [`health.md`](./health.md).

---

## Purpose

`@i18nprune/ui` is a **narrow, presentational kit** for the **runtime cluster** — operational surfaces where users run i18nprune workflows (web runtime, report SPA, worker Swagger shell). It is **not** a global design system and **must not** absorb marketing, editor, or domain logic.

---

## Domain separation model

The repository has **three UI domains**. Only one consumes `@i18nprune/ui`.

| Domain | Paths | Role | Uses `@i18nprune/ui` |
|--------|-------|------|----------------------|
| **Marketing** | `apps/landing` | Brand, animation, conversion | **Never** |
| **Editor host** | `apps/extension/src/webview` | VS Code-native dashboard | **Never** |
| **Runtime cluster** | `apps/web`, `apps/report`, worker `/docs` | Operational tools | **Yes** (React + static CSS/HTML shell) |

**Out of scope for `@i18nprune/ui`:**

| Surface | Path | Why |
|---------|------|-----|
| User docs | `apps/docs` (VitePress) | End-user reference site |
| CLI TTY | `packages/cli` | Terminal / Inquirer UX |

### Why landing stays isolated

- Tailwind 3, React 19, Motion, marketing sections — high freedom for visual iteration.
- Not optimized for runtime operational consistency; intentionally allowed to diverge.
- Listed **out of C.3 scope** in [`maintainer/phases/apps.md`](../phases/apps.md).

### Why extension stays isolated

- Tailwind 4, VS Code tokens (`--color-vsc-*`), editor integration expectations.
- Must feel native to VS Code, not like web/report.
- Shiki bundle is editor-scoped (full scan grammars) — not shared with runtime.

### Why runtime apps are unified (narrowly)

- `apps/web` and `apps/report` share operational patterns: toolbars, theme toggles, dropdowns, modals, pagination, confirm flows.
- Same user journey: open project → run ops → view report → share link.
- Unification means **shared primitives and semantic tokens** — not one accent color or one layout shell.

---

## Runtime cluster definition

**Members:**

| Surface | Stack (today) | `@i18nprune/ui` usage |
|---------|---------------|------------------------|
| `apps/web` | React 18, vanilla CSS | React primitives + shared CSS (Phase 1+) |
| `apps/report` | React 18, vanilla CSS, single-file CLI embed | Same |
| `apps/workers/i18nprune` `/docs` | Hono + `@hono/swagger-ui` | Static HTML shell + CSS overrides only (Phase 4+) |

**Not members:** `apps/landing`, `apps/extension/src/webview`, `apps/docs`, `apps/workers/meta` (separate hygiene when touched).

---

## Package layout (Phase 1+)

```txt
packages/ui/src/
├── types/<area>/     # Public types — leaf files + index.ts barrel
├── react/<area>/     # Components — import types from types/<area>
├── swagger/          # Static worker docs shell (not under docs/)
├── styles/           # CSS tokens + runtime styles
└── utils/            # Pure helpers (clipboard, …)
```

Call sites import **types** from `@i18nprune/ui/types/<area>` and **components** from `@i18nprune/ui/react/<area>`.

---

### Core rule (non-negotiable)

> **If a component requires domain imports** (`@i18nprune/core`, worker clients, workspace state, routing orchestration, share logic, report ingestion, zip parsing, etc.), **it does NOT belong in `packages/ui`.**

Mirror the [core purity contract](../agents/architecture.md#2-core-purity-contract): `@i18nprune/ui` is **presentational-only**.

### Dependency allowlist

| Allowed | Forbidden |
|---------|-----------|
| `react`, `react-dom` (peer) | `@i18nprune/core` |
| Dev: `typescript`, `vitest`, testing libs | `@i18nprune/report-schema`, `i18nprune` |
| Static `.css` files | `hono`, worker env / route types |
| Pure TS utils (e.g. clipboard) | `react-router-dom` |
| | `zod`, `fflate` |
| | `apps/workers/**` imports |

**Reverse rule:** `@i18nprune/core` must **never** import `@i18nprune/ui`.

### Classification test (every PR)

1. Does it render UI? **No** → not `packages/ui`.
2. Does it import domain types, hooks, or API clients? **Yes** → app-local.
3. Does it know routes, report pages, workspace IDs, or share URLs? **Yes** → app-local.
4. Is it Swagger/OpenAPI spec or route logic? **Worker-local**; ui may only supply CSS/HTML shell.

---

## Extraction boundaries

### Should move (Phase 1+)

| Item | Target export |
|------|----------------|
| `ToolbarDropdown` | `@i18nprune/ui/react/toolbar` |
| `ThemeProvider` / `useTheme` | `@i18nprune/ui/react/theme` |
| `copyText` / `CopyButton` | `@i18nprune/ui/utils/clipboard`, `@i18nprune/ui/react/feedback` |
| Modal / confirm base | `@i18nprune/ui/react/overlay` |
| List pagination controls | `@i18nprune/ui/react/pagination` |
| Shared dropdown/modal CSS | `@i18nprune/ui/styles/runtime.css` |
| Semantic tokens | `@i18nprune/ui/styles/tokens.css` |
| Swagger HTML shell + overrides | `@i18nprune/ui/swagger`, `@i18nprune/ui/styles/swagger-overrides.css` |

### Must remain app-local

| Surface | Examples |
|---------|----------|
| **web** | `RuntimeHeader`, `EcosystemNavMenu`, workspace tree, zip/share modals, Prism `JsonViewer` |
| **report** | `AppShell`, payload import, search/print contexts, inline SVG icons |
| **landing** | All marketing sections, CommandPalette, ShikiCode, Motion |
| **extension** | Dashboard chrome, FileExplorer, VSC `Badge`/`Button`/`Modal` |
| **workers** | OpenAPI spec, route handlers, DO storage |

---

## Anti-patterns

| Anti-pattern | Why it fails |
|--------------|--------------|
| `import { getDocsUrl } from '@i18nprune/core'` in ui | Couples kit to domain — pass `href` props from apps |
| Shared `WorkspaceTreePanel` in ui | Domain tree + zip state |
| Shared `useReport()` in ui | Report context is domain |
| One `Button` for web + landing + extension | Three visual languages |
| Shiki / Tailwind / Motion in ui root | Pulls wrong stack into report embed |
| `packages/ui` importing `react-router-dom` | Routing is app orchestration |
| Re-exporting ui from core | Inverts dependency graph |
| Hono middleware inside ui | Worker is the host |

---

## Swagger integration rules

**Do not rebuild API docs.** Keep OpenAPI specs and routes in workers.

| Asset | Owner |
|-------|--------|
| `openapi.ts` / spec JSON | Worker |
| Route registration (`/docs`, `/openapi.json`) | Worker |
| Header links (may use core URLs) | Worker builds HTML; passes strings into shell |
| `swagger-overrides.css` | `@i18nprune/ui/styles/` |
| `renderSwaggerShell()` (static HTML) | `@i18nprune/ui/swagger` |

**Constraints:**

- **Shell + CSS only** — no React in worker docs pages.
- Pin `swagger-ui-dist` version when customizing CSS; treat overrides as a compatibility shim.
- Dark/light: prefer `prefers-color-scheme` first; optional toggle via `data-theme` on `<html>` without React.

---

## Non-goals / forbidden directions

- **`packages/ui` is NOT a global design system** — no mandate that all apps look the same.
- **`apps/landing` remains intentionally isolated** — no imports from `@i18nprune/ui`.
- **`apps/extension/src/webview` remains intentionally isolated** — VS Code-native UX only.
- **No shared Tailwind system** across runtime + marketing + editor.
- **No shared Shiki system** in ui — landing and extension keep separate highlighter configs.
- **No `@i18nprune/core` imports inside `packages/ui`** — enforced by `pnpm ui:purity`.
- **No routing, business, or domain logic inside ui** — no router, no worker fetch, no report ingest.
- **Swagger integration is shell/CSS only** — no OpenAPI parsing or route logic in ui.
- **No god barrel** — prefer subpath exports; avoid default re-export of all primitives from root.
- **No landing/extension migration** as part of ui phases.

---

## Migration phases

| Phase | Scope | Status |
|-------|-------|--------|
| **0** | Scaffold, docs, purity gates | **Shipped** |
| **1** | Theme + tokens + clipboard (`web`, `report`) | **Shipped** |
| **2** | `ToolbarDropdown` + `runtime.css` | **Shipped** |
| **3** | Confirm dialog + pagination | **Shipped** |
| **4** | Worker Swagger shell (optional pre/post v1) | **Shipped** |

**Timing:** Run Phases 1–3 in **hygiene PRs between C.3 share sub-slices** — not mixed into `packages/core/src/share/**` parity work.

**Validation after structural ui changes:**

```bash
pnpm typecheck && pnpm test && pnpm knip && pnpm madge:circular && pnpm ui:purity
pnpm web:build && pnpm report:build && pnpm cli:build   # after app adoption
```

---

## Enforcement strategy

| Gate | Mechanism |
|------|-----------|
| Forbidden imports | `pnpm ui:purity` — [`scripts/ui/purity-check.mjs`](../../scripts/ui/purity-check.mjs) |
| Cycles | `pnpm madge:circular` includes `packages/ui/src` |
| Dead code / deps | `pnpm knip` workspace `packages/ui` |
| Types | `pnpm ui:typecheck` in root `pnpm typecheck` chain |
| Package deps | `packages/ui/package.json` — no forbidden runtime dependencies |

Extend ESLint `no-restricted-imports` only if grep proves insufficient.

---

## PR / review checklist

- [ ] Change is in runtime cluster consumer **or** `packages/ui` — not landing/extension
- [ ] No `@i18nprune/core` / worker / router imports under `packages/ui/src`
- [ ] No Tailwind / Shiki / Motion added to `packages/ui`
- [ ] App orchestration stays in apps; ui receives data via props
- [ ] CSS class names preserved when report embed parity matters
- [ ] `pnpm typecheck` · `pnpm test` · `pnpm knip` · `pnpm madge:circular` · `pnpm ui:purity`
- [ ] If report UI touched post-migration: `pnpm cli:build`

---

## Related

- [`maintainer/phases/apps.md`](../phases/apps.md) — C.3 scope (web, report, workers; not landing)
- [`maintainer/systems/health.md`](./health.md) — health gates
- [`packages/ui/README.md`](../../packages/ui/README.md) — package-local quick reference
