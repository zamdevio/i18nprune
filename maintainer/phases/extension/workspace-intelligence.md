# Phase: Workspace intelligence

**Status:** planned  
**Goal:** One long-lived **workspace intelligence** layer in the extension host: hydrate, watch, incrementally update, expose **fast read APIs** for all UX.

Central phase: everything else should become a **consumer** of this layer.

---

## Conceptual model

```txt
hydrate once
watch forever
incrementally update
serve fast reads
```

- **Hydrate:** Load normalized project state from core (or trigger core hydration) when project binding is known.
- **Watch:** Filesystem (and optionally editor) events routed into **scoped invalidation**, not blind full rescans.
- **Incremental update:** Mutate in-memory graph or core-backed cache according to change type (locale file vs config vs source).
- **Fast reads:** Synchronous or micro-task APIs: “what do we know about key *K*?” “what locales miss *K*?” — backed by data core already computed or incrementally refreshed.

---

## Responsibilities

| Responsibility | Notes |
|----------------|--------|
| Hydrate project analysis | Single code path; no duplicate CLI subprocess unless core design requires it temporarily. |
| Maintain hot memory | One authoritative in-extension view of “current intel” for the active binding(s). |
| Incremental updates | Queue + debounce; classify paths; invalidate smallest subgraph core supports. |
| File ownership | Map URI/path → project node (for multi-project). |
| Key intelligence | Read API: status, coverage, previews — **sourced from core**, not recomputed ad hoc. |
| Locale intelligence | Per-locale aggregates as core exposes them. |
| Provenance | File/line or bundle path for a key — as core normalizes it. |
| Diagnostics state | Optional: hold last published diagnostic snapshot version for consistency with editor (implementation later). |

---

## Consumers (read-only)

Examples — **no second state**:

- Hover provider  
- Diagnostic collection  
- Completion provider  
- Dashboard / webview data pump  
- Commands (“reveal”, “open translation”)

---

## Dependencies

- **Foundation** phase complete enough to bind projects and subscribe to workspace lifecycle.
- **[core-integration.md](core-integration.md)** — pinned core surface, `CoreResolvedPaths`, envelopes (avoid ad hoc parallel contracts).
- **Core:** Locales + normalized project/read APIs stable enough that the extension is not inventing merge rules for keys.

---

## Rules

- **No duplicated state systems** — one engine instance (or one per workspace folder if required), not parallel caches.
- **No repeated full analysis** on every file save unless core mandates it; prefer incremental contracts from core when available.

---

## Non-goals

- Defining hover Markdown here.
- Implementing invalidation algorithms in this doc — only the **requirement** that updates be incremental.
