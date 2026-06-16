# Phase — Light dataflow (no full AST)

**Depth:** `fast`  
**Perf budget:** +50–200 ms on ~316 files (same-file assignment ledger, O(lines) per file)  
**Prerequisite:** E.1 fusion shipped · supersedes E.3 non-literal hints when this lands — [`README.md`](./README.md)  
**Guardrails:** [`guardrails.md`](./guardrails.md) · hints ≠ proven keys

---

## Problem

```ts
const NS = 'app';
const key = `${NS}.greeting`;
t(key);  // today: non_literal — correct but unhelpful

const title = t(`${NS}.title`);  // template_resolved in keySites only
```

We want **same-file** def-use hints without a TypeScript compiler.

---

## Target behavior

### Same-file assignment ledger (regex + line order)

Per file, maintain lightweight tables:

| Table | Tracks |
|-------|--------|
| `constStrings` | existing constmap |
| `templateBindings` | `const k = \`…\`` where inner fully resolves → `k → resolvedKey` |
| `aliasHelpers` | `const tt = t` (HOC §A, 1-hop) |

When `t(firstArg)` and firstArg is simple identifier:

- If `templateBindings[id]` → hint `resolvedViaAssignment` (display / JSON) — **still `non_literal` kind** unless policy promotes (default: no promotion).
- If id unknown → unchanged `non_literal`.

### Mixed template chains

```ts
const partial = `${NS}.nav`;
t(`${partial}.${page}`);  // tier 1: mark dynamic; tier 2 optional fold if partial resolved
```

Phase 1: inventory-only hint. Phase 2: fold when `partial` is proven string const.

---

## Speed-safe design

| Technique | Why fast |
|-----------|----------|
| Line-scoped scan, single pass per file | Same as today’s file read |
| No AST — regex for `const X =` / `let X =` | Bounded patterns |
| Cap chain depth = 2 | Prevent pathological files |
| Skip minified bundles | Extension filter already exists |

**No cross-file variable propagation** (see [`cross-file.md`](./cross-file.md) for const exports only).

---

## Overlap with current temp plan

| Current slice | v2 light-dataflow |
|---------------|-------------------|
| E.2 const-map (`let`, block scope) | Absorbed here |
| E.3 non-template hints | Absorbed here |
| E.1 mixed templates | Unchanged — orthogonal |

Finish E.1–E.6 first; implement light-dataflow as v2 phase, not duplicate E.3 in two places.

---

## Acceptance

- `const k = \`${NS}.x\`; t(k)` → `non_literal` + hint `resolvedViaAssignment: 'app.x'`.
- Parity: `provenKeys` unchanged (hints only).
- **Perf:** tier 1 total ≤ 750 ms cold on web benchmark.

---

## Non-goals

- SSA / CFG / type narrowing.
- `t(cond ? 'a' : 'b')` branch enumeration (classify `non_literal` + optional `branch_literals` hint).
- Cross-function closure capture.

---

## Related

- [`hoc.md`](./hoc.md) — helper alias table
- [`README.md`](./README.md) — tier model
