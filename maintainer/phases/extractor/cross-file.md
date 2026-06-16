# Phase — Cross-file const / namespace keys

**Depth:** `fast` (full heuristic stack — no TS Program)  
**Perf budget:** +100–300 ms cold on ~316 files (one export-index pass); **~0 ms incremental** when project cache hits  
**Prerequisite:** HOC (hooks section) or parallel · static import resolver in core  
**Guardrails:** [`guardrails.md`](./guardrails.md) § Cross-file boundaries · hard stops

---

## Problem

```ts
// constants.ts
export const NS = 'app';

// page.tsx
import { NS } from './constants';
t(`${NS}.title`);  // today: NS not in per-file constMap → runtime_only
```

Per-file const maps are intentional (avoid `NS` collisions). Cross-file needs a **project index**, not merged maps.

---

## Target behavior

1. Build **export string const index** at scan start:
   - `resolvedFilePath → { NS: 'app', ROUTES: '…' }` from `export const X = '…'` / `export { NS } from` (static paths only).
2. Resolve `import { NS } from './constants'` via relative path (+ optional tsconfig `paths` in tier 2b).
3. Merge into **per-file effective const map** as `importedConsts` overlay (provenance: `from: 'constants.ts'`).
4. Existing `analyzeTemplateCall` / constmap unchanged — just richer map input.

**Do not** global-merge all files into one map (collision hazard).

---

## Speed-safe design

| Step | Cost | Mitigation |
|------|------|------------|
| List + read all source files | Already paid in validate | Reuse scan list |
| Parse exports per file | Regex on export lines only | Skip `node_modules`, tests if configured |
| Resolve relative imports | O(imports) hash lookups | Cache `importPath → resolvedPath` |
| tsconfig paths | Optional tier 2b | Parse `tsconfig` once, cache |

**Lazy:** skip index build if zero `` import { … } from './' `` string-const patterns detected in project sample.

**Hard limits:** max re-export depth 2 · no dynamic `import(expr)` · no `require(variable)`.

---

## Acceptance

- Monorepo fixture: shared `NS` barrel → `` `${NS}.x` `` resolves like same-file.
- Collision fixture: two files export different `NS` — importers get correct per-file overlay.
- **Perf:** cold ≤ 900 ms on web-scale; with cache, delta &lt; 50 ms vs tier 0.

---

## Non-goals

- Cross-file **function** alias (`export const t = …` in wrapper package) — HOC + import bindings.
- Type-only exports (`export type NS = …`).
- Full program semantic resolution (Tier 3 — separate doc).

---

## Related

- [`finite-keys.md`](./finite-keys.md) — locale expansion under resolved prefixes
- [`README.md`](./README.md) — perf budget
