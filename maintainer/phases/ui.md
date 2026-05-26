# UI kit phase — `@i18nprune/ui` migration tracker

**Status:** Phases **0–4 shipped** — runtime cluster uses shared theme, toolbar, overlay, pagination, and worker Swagger shell.  
**Rules (canonical):** [`maintainer/systems/ui.md`](../systems/ui.md) — domain boundaries, purity allowlist, anti-patterns, enforcement.  
**Package:** [`packages/ui/README.md`](../../packages/ui/README.md)

**For agents:** treat this file as the **plan and trace** only. Do not link it from `maintainer/systems/*` (this file is deleted after any future phases close). Implementation rules live in **`systems/ui.md`**.

---

## Why a separate phase doc

`@i18nprune/ui` unifies **operational** surfaces (`apps/web`, `apps/report`, worker `/docs`) without collapsing marketing (`apps/landing`) or the VS Code webview. Migration was split into hygiene PRs so share/core parity work stayed isolated.

---

## Migration phases (tracker)

| Phase | Scope | Status |
|-------|-------|--------|
| **0** | Scaffold `packages/ui`, docs, `pnpm ui:purity` gate | **Shipped** |
| **1** | Theme + tokens + clipboard (`web`, `report`) | **Shipped** |
| **2** | `ToolbarDropdown` + `runtime.css` | **Shipped** |
| **3** | Confirm dialog + pagination | **Shipped** |
| **4** | Worker Swagger shell + reusable `/docs` polish | **Shipped** |

**Discipline:** UI extraction PRs stay **out of** `packages/core/src/share/**` parity slices — run between C.3 share sub-slices when touching runtime chrome.

---

## Extraction backlog

Items **moved** vs **still app-local** (update rows when closing extraction PRs).

### Shipped in ui package

| Item | Export |
|------|--------|
| Theme provider / hook | `@i18nprune/ui/react/theme` |
| `copyText` / `CopyButton` | `@i18nprune/ui/utils/clipboard`, `@i18nprune/ui/react/feedback` |
| `ToolbarDropdown` | `@i18nprune/ui/react/toolbar` |
| Modal / confirm base | `@i18nprune/ui/react/overlay` |
| List pagination controls | `@i18nprune/ui/react/pagination` |
| Shared dropdown/modal CSS | `@i18nprune/ui/styles/runtime.css` |
| Semantic tokens | `@i18nprune/ui/styles/tokens.css` |
| Swagger HTML shell + overrides | `@i18nprune/ui/swagger`, `@i18nprune/ui/styles/swagger-overrides.css` |

### Must remain app-local (no phase planned)

| Surface | Examples |
|---------|----------|
| **web** | `RuntimeHeader`, `EcosystemNavMenu`, workspace tree, zip/share modals, Prism `JsonViewer` |
| **report** | `AppShell`, payload import, search/print contexts, inline SVG icons |
| **landing** | All marketing sections (never imports ui) |
| **extension webview** | Dashboard chrome, FileExplorer, VSC primitives (never imports ui) |
| **workers** | OpenAPI spec, route handlers, DO storage |

---

## Future phases (optional — not started)

| Phase | Scope | Status |
|-------|-------|--------|
| **5** | Adopt Swagger shell on `apps/workers/meta` | **Planned** |
| **6** | Report/web visual parity pass (tokens only; no domain components) | **Backlog** |

Delete this section when phases 5–6 ship or are cancelled.

---

## Validation (after structural ui changes)

```bash
pnpm typecheck && pnpm test && pnpm knip && pnpm madge:circular && pnpm ui:purity
pnpm web:build && pnpm report:build && pnpm cli:build   # after app adoption
pnpm ui:check:swagger-css   # when swagger-overrides.css changes
```

---

## Cross-links

- **Apps / share phase:** [`apps.md`](./apps.md) (C.3 — web/report; landing out of scope)
- **Shipped receipts:** [`shipped-slices.md`](./shipped-slices.md) (add a row when closing optional phases 5–6)
- **Architecture § UI domains:** [`maintainer/agents/architecture.md` § 11](../agents/architecture.md#11-ui-domains)
