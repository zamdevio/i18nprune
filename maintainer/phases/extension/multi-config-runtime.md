# Phase: Multi-config runtime

**Status:** planned  
**Goal:** Multiple `i18nprune.config.*` files in one VS Code window; switching the active project is **instant, deterministic, and never requires extension reload or host restart**.

Focus: **runtime project binding**, **per-config state isolation**, and **reactive updates** across sidebar, dashboard, and future intelligence consumers.

---

## Core principle

> **Active config is runtime input, not extension lifecycle.**

The host must not re-run `activate`, tear down subscriptions, or restart the Extension Development Host when:

- the user picks a different config in the project selector
- a config file is added, removed, or saved on disk
- workspace folders change (multi-root)

Updates must be **event-driven and incremental** — same posture as [workspace-intelligence.md](./workspace-intelligence.md).

---

## Baseline (already in `apps/extension/`)

Partial implementation exists; this phase **hardens and completes** it — not a greenfield rewrite.

| Area | Today | Gap for this phase |
|------|--------|-------------------|
| Discovery | `discoverI18npruneProjects()` — glob all `i18nprune.config.*` under workspace folders | Treat invalid/unreadable configs explicitly; surface errors in Project UI |
| Active selection | `workspaceProjects.ts` — `activeConfigPath`, quick-pick, `workspaceState` persistence | Single broadcast bus; no ad hoc reads of module-level state |
| FS watch | `workspaceFilesystemWatchers.ts` — debounced rescan (2s) + explorer stale signal | Config-path–scoped watchers; faster, deterministic registry updates |
| UI sync | `postProjectsSnapshot` → dashboard IPC; sidebar listens to `onDidChangeActiveProjectWorkspace` | All consumers subscribe to one project-runtime API |
| Implicit fallback | Workspace folder root when no config | Documented, stable; no leakage into config-scoped caches |

---

## Responsibilities

### 1. Project registry (live)

- Maintain the set of discovered config projects (id = absolute config path).
- **Add** / **remove** / **modify** on disk → update registry without manual refresh or reload.
- Registry entries carry: `projectRoot`, owning workspace folder, display label (existing `DiscoveredProject` shape is the starting point).

### 2. Active project pointer

- One **active config id** (or implicit workspace-default mode) per window.
- Switching active project **only moves the pointer** and notifies subscribers — no extension reactivation.
- Persist selection in `workspaceState` (already); invalidate persistence when the saved id disappears from the registry.

### 3. Project runtime layer (single source of truth)

Consolidate today’s `workspaceProjects` module-level state into one host-side runtime (name TBD at implementation — e.g. `ProjectRuntime`):

| Responsibility | Notes |
|----------------|--------|
| Hold active project id + discovery cache | Replace scattered module singletons |
| Emit `onDidChangeActiveProject` / `onDidChangeProjectRegistry` | Sidebar, webview, future WI attach here |
| Expose `getActiveProjectRoot()`, resolved config snapshot | Load via core adapters — **no extension-owned config parser** |
| Scope downstream work | Commands and webview IPC read from this layer only |

All subsystems **subscribe**; none reinitialize on switch.

### 4. Reactive consumers

When active project or registry changes, consumers update incrementally:

| Consumer | Expected behavior |
|----------|-------------------|
| Sidebar (Project tree) | Refresh validation/status for **active** project only |
| Dashboard / webview | `workspaceProjects` snapshot + scoped stale signals |
| Generate / validate runs | `cwd` + paths from active binding ([core-integration.md](./core-integration.md)) |
| Future workspace intelligence | Per-config analysis cache; swap pointer, not rebuild host |

Avoid full teardown unless core requires a scoped full rescan for that config (respect [cache discipline](../../systems/cache.md) — project disk cache is core-owned).

### 5. Workspace → config mapping

| Input | Maps to |
|-------|---------|
| VS Code workspace folder | Zero or more discovered configs under that folder |
| User selection (quick-pick / future UI) | Active config id |
| No configs in folder | Implicit mode: workspace folder root as `projectRoot` (existing behavior) |

Multi-root: each folder has its own config set; active project may point at any discovered config in the window.

### 6. Per-config isolation

Each config id is a **context key**:

- In-memory extension caches keyed by config id (or project root) — no cross-config reads for diagnostics, dashboard data, or run results.
- Generated artifacts and run history tagged with active config at execution time.
- Switching config does **not** clear other configs’ cached intel (LRU/eviction policy deferred to [performance.md](./performance.md)).

---

## Dependencies

- **[foundation.md](./foundation.md)** — activation shell, project discovery, settings.
- **[core-integration.md](./core-integration.md)** — `CoreResolvedPaths`, config load, `run*` entrypoints.
- **Workspace intelligence** (optional overlap) — if WI lands first, it becomes the main consumer; this phase still owns **registry + active pointer + isolation contract**.

**Sequencing:** Can start **in parallel** with early dashboard work once Foundation discovery exists (current repo state). Must complete **before** diagnostics/hover assume a stable per-config intel layer.

---

## Performance targets (UX budgets)

| Event | Target |
|-------|--------|
| Active project switch (UI feedback) | < 50 ms perceived (sidebar label, webview header) |
| Config file added/removed on disk | Registry updated within watcher debounce (tighten from 2s where safe) |
| Config switch | No blocking modal; no extension host restart |

Heavy work (validate, analysis) may run async — UI shows scoped loading for **that panel**, not a global “extension reloading” state.

---

## Rules (align with extension hub)

- **Core owns config semantics** — extension loads and binds; no duplicate merge/locale rules.
- **No reload-based workflow** — `Developer: Reload Window` is not a valid user recovery path for project switch.
- **One runtime bus** — avoid parallel copies of `activeConfigPath` in unrelated modules.

---

## Non-goals

- Comparing two configs side-by-side in one webview (see [post-mvp.md](./post-mvp.md)).
- Cross-config diagnostics in a single editor pass (active config only for v1).
- Defining concrete TypeScript interfaces in this doc (belong in `apps/extension/` + core types when implementing).
- Replacing core project-disk cache policy — extension scopes **host** state only.

---

## Exit criteria

- [ ] Multiple valid configs coexist in one window; selector lists all discovered projects.
- [ ] Switching active project does not reload the extension; all registered consumers update via events.
- [ ] Adding/removing/saving a config file updates the registry without manual refresh.
- [ ] No subsystem reads stale active project from a duplicate global — single runtime module.
- [ ] Per-config isolation verified: switch config A → B → A does not show B’s validation/dashboard data under A’s binding.
- [ ] Documented in [apps/extension/README.md](../../../apps/extension/README.md) (behavior + dev notes).
