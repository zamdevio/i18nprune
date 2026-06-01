# Tree phase — shipped + apps audit

**Status:** **Shipped** (2026-06-01) — **T0–T10** on `packages/core` + `packages/cli` (receipt: [`shipped-slices.md`](./shipped-slices.md), git history on `main`).

**Hub:** [`V1-RELEASE.md`](./V1-RELEASE.md) · **Sprint narrative:** [`active-phase.md`](./active-phase.md) · **Next phase:** [`docs-refactor.md`](./docs-refactor.md)

This file no longer tracks T0–T10 execution. It holds the **`apps/*` layout audit** (2026-06-01) so we can decide whether any app needs a tree-style pass later.

---

## Policy reference (core tree phase)

When evaluating apps, the same conventions used for core apply in spirit:

| Signal | Healthy | Drift |
|--------|---------|-------|
| Types | Dedicated `types/` (or domain type modules) | Scattered `export type` in UI/logic files |
| Re-exports | `export type { … }` in barrels (`index.ts`) only | Shims in hooks, `do.ts`, non-barrel modules |
| Barrels | Domain `index.ts` at folder edges | Deep-only imports with no barrels |
| Tests | `__tests__/` beside the logic they cover | No tests, or tests only at app root |

**Survey commands** (re-run before an app pass):

```bash
rg "export type \{" apps --glob '*.{ts,tsx}' | rg -v '/index\.(ts|tsx)' | wc -l
rg "export type \{" apps --glob '*.{ts,tsx}'
rg "^export \{ " apps --glob '*.{ts,tsx}'
find apps -type d -name types ! -path '*/node_modules/*'
find apps -type d -name __tests__ ! -path '*/node_modules/*'
```

**Repo-wide non-index `export type {` count (2026-06-01):** **3** — `apps/web/src/hooks/useAppRoute.ts`, `apps/web/src/types/storage/recentZip.ts`, `apps/workers/i18nprune/src/lib/do.ts`.

---

## Apps audit summary

| App | Has `types/` or equivalent? | Re-export shims (`export type {`, non-`index`) | Types in logic (estimate / samples) | Test layout | Severity | Recommendation |
|-----|----------------------------|-----------------------------------------------|-------------------------------------|---------------|----------|----------------|
| **landing** | No — `src/lib/`, `src/context/`, `functions/_shared/` | **0** | **~7** — `lib/meta.ts`, `lib/http.ts`, `context/MetaContext.tsx`, `functions/_shared/ogCard.ts` | None | **Low** | Leave as-is; small marketing SPA; colocated fetch/meta types are fine. Add `types/` only if the app grows past ~80 TS files. |
| **extension** | **Partial** — `webview/src/types/`; host types in `extension/*` | **0** | **~22** — host (`extension/ops`, `workspace`, `bootstrap`) + webview (`services/api.ts`, hooks, `app/config/navigation.ts`); duplicate `DashboardEmbedSurface` in host vs webview | None in `apps/extension` | **Med** | Optional post-v1 pass: move host-facing types under `extension/types/`; dedupe webview/host mirrors; keep React prop types colocated. Not blocking docs/release. |
| **web** | **Yes** — `src/types/` (`app`, `worker`, `workspace`, `storage`, `constants`) | **2** — hook re-export in `useAppRoute.ts`; `types/storage/recentZip.ts` aggregates from core | **0** outside `types/` (template-aligned) | None | **Low** | No tree pass needed; optionally drop hook type re-export and import from `types/` only. |
| **report** | **Yes** — `src/types/` (`report`, `share`, `worker`) + schema re-exports | **0** non-index; barrels in `storage/index.ts`, `data/loader/index.ts`, `lib/editor`, `lib/open-in-editor` | **~47** — many `*Props` / panel types in `components/**` and `lib/open-in-editor/**` (normal for React); domain types mostly in `types/` | **Partial** — `storage/__tests__/`, `lib/__tests__/` only (~12 tests); no component tests | **Med** | Largest app (~115 TS files); consider moving non-UI domain types out of `open-in-editor` impl into `types/` if that subtree grows; expand `__tests__/` only where logic is non-trivial. Not required before v1. |
| **docs** (`apps/docs`) | N/A — VitePress config (~3 TS files) | **0** | N/A | N/A | **Low** | Out of scope for tree layout; content lives under repo `docs/`. |
| **workers/i18nprune** | **Partial** — `routes/types.ts`; lib types in impl | **1** — `lib/do.ts` re-exports core DO row types | **~8** — `lib/storage/*`, `lib/rateLimit/policy.ts`, `routes/types.ts` | **Good** — `lib/storage/__tests__/`, `lib/rateLimit/__tests__/` | **Med** | Optional: add `src/types/` for worker-only shapes; move `export type` off `do.ts` into a barrel; keep test colocation as-is. |
| **workers/meta** | **Yes** — `src/types/index.ts` | **0** | **1** — `services/meta.ts` (`V1Part`); rest in `types/` | None (tiny surface) | **Low** | No pass needed. |

### Notes by app

- **landing** (~46 TS/TSX): flat `src/` (`components`, `sections`, `hooks`); **no** `index.ts` barrels — acceptable at this size; imports are mostly direct paths.
- **extension** (~60 TS/TSX): two runtimes (VS Code host + webview); webview already has a types barrel; host is the main drift vector.
- **web** (~78 TS/TSX): **19** barrel `index.ts` files; mirrors core tree discipline; depends on `@i18nprune/core` / `@i18nprune/ui` without re-exporting core types broadly.
- **report** (~115 TS/TSX): **35** barrels; `types/` re-exports `@i18nprune/report-schema`; heavy `lib/open-in-editor/` subtree with intentional barrel re-exports of policy/adapter types.
- **workers**: **i18nprune** is the substantive worker; **meta** is a small metadata/cache worker with clean `types/`.

---

## Conclusion — tree pass needed per app?

| App | Tree pass before closing tree phase? | Why |
|-----|--------------------------------------|-----|
| **landing** | **No** | Small, stable marketing site; scattered types are low risk. |
| **extension** | **No** (defer optional **Med** hygiene) | Shipped product surface; host/webview split is intentional; not blocking v1. |
| **web** | **No** | Already matches core tree conventions. |
| **report** | **No** for v1 (**optional** later) | UI-idiomatic prop types dominate; `types/` + partial tests are sufficient for ship. |
| **docs** | **No** | Not an application codebase. |
| **workers/i18nprune** | **No** (optional small cleanup) | Tests colocated; only notable shim is `do.ts`. |
| **workers/meta** | **No** | Already centralized. |

**Overall:** **No `apps/*` tree pass is required** to retire the core tree execution tracker. Revisit **report** and **extension** only if navigation pain shows up in maintainer work.

---

## Post-core reminders

| Area | Status |
|------|--------|
| **`packages/core` + `packages/cli`** | **Shipped** — T0–T10 ([`shipped-slices.md`](./shipped-slices.md)) |
| **`packages/cli` (T10)** | Barrel imports; no core type re-export shims |
| **`apps/*`** | **Decision deferred** until after this audit — see table above |

---

## Related

- [`shipped-slices.md`](./shipped-slices.md) — tree row + do not re-implement T1–T10
- [`maintainer/agents/architecture.md`](../agents/architecture.md) — package topology (core/cli)
- [`maintainer/systems/health.md`](../systems/health.md) — gates if an app pass is opened later
- [`docs-refactor.md`](./docs-refactor.md) — **active** v1 docs phase
- [`active-phase.md`](./active-phase.md) — current sprint focus
