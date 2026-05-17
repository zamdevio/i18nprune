# Phase: Performance

**Status:** planned  
**Goal:** Native-feeling responsiveness — **documented budgets and practices**, not premature micro-optimization.

---

## Philosophy

- **Perceived instant** beats raw benchmarks: avoid blocking the extension host; batch and debounce.
- **Lookup-first** — hovers, completions, and inline requests read **precomputed** structures maintained by workspace intelligence.
- **Incremental** — file edits invalidate the smallest graph the core contract allows; never “rebuild everything” by default on unrelated changes.

---

## Rules to avoid

```txt
full workspace scans on hover
```

```txt
rebuild everything on every file edit
```

```txt
duplicate heavy work in dashboard + editor providers
```

---

## Aspirations (not guarantees)

- **Sub-50ms** for the synchronous portion of hover/completion where possible; heavier work async with cancellation.
- Coalesced FS events; capped Markdown size; truncated locale lists with “see more” in dashboard.

---

## Dependencies

- **Diagnostics** (and real usage) — informs where budgets matter; performance phase tightens measurement and fixes hotspots **after** features exist.

---

## Non-goals

- Specifying exact profiler steps in this doc.
- Optimizing before workspace intelligence exists (nothing meaningful to measure).
