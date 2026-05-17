# Phase: Dashboard

**Status:** planned  
**Goal:** Project intelligence UI (webview and/or native views) as a **consumer** of the same workspace intelligence layer — **no** separate backend logic.

---

## Potential areas (product-shaped, not prescriptive)

- Locale coverage overview  
- Missing keys / issues summary  
- Dynamic usage sites (if core exposes)  
- Project stats  
- Quick actions (jump to file, refresh, open settings)  
- Issue summaries aligned with diagnostics/hover  

### Generate tab (separate phase doc)

The **Generate** dashboard surface (IPC, `runGenerate`, host hooks, progress, results) is specified in **[generate.md](generate.md)** so this file stays focused on **intelligence/consistency** views. Generate reuses the same dashboard shell and message channel patterns but **must not** duplicate CLI orchestration in the webview.

---

## Rules

- **Single pipeline:** dashboard requests data from workspace intelligence (or core via the same adapter), not a forked “dashboard-only” analyzer.
- **Consistent numbers** — metrics shown in dashboard match hover/diagnostics for the same snapshot version.
- **Versioning** — UI should handle stale snapshots (loading / refresh affordance) without double-fetching core on every panel focus unless needed.

---

## Dependencies

- **Workspace intelligence** — formal API for snapshots or subscriptions the webview can use.
- **Foundation** — webview hosting, command wiring (may already exist; this phase **aligns** consumption with the intelligence layer).

---

## Non-goals

- Re-implementing CLI report generation in TypeScript in the webview bundle.
- A second caching layer that diverges from host state.
