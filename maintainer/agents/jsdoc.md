# JSDoc guide

When, where, and how to write JSDoc in this codebase.

---

## When to add JSDoc

- **New or edited public functions** in `packages/core/src/` — these serve SDK consumers.
- **`runXxx` entries** — always document the operation's purpose, inputs, and return shape.
- **Exported types** in `packages/core/src/types/` — brief `/** … */` on the type and its key fields.
- **Non-obvious internal helpers** — when the function name alone doesn't convey intent, constraints, or side effects.

**Skip JSDoc for:**
- Private/unexported helpers with self-explanatory names
- Barrel `index.ts` re-exports
- Test files

---

## Tiers

| Tier | Who | Standard |
|------|-----|----------|
| **1 — Must-have** | Public API (`runXxx`, `createCoreContext`, exported types) | Summary + `@param` + `@returns` + `@remarks` for constraints |
| **2 — Required** | Load-bearing internals named in phase docs | Summary + `@remarks` |
| **3 — Nice-to-have** | Everything else | Summary only |

---

## How to write

### Summary line

One sentence, imperative mood. State **what** and **why**, not **how**.

```typescript
/** Resolve dynamic key call sites from project source files. */
export function runDynamic(ctx: CoreContext, opts: DynamicRunOptions): DynamicRunResult {
```

### `@remarks` — constraints and purity

Use `@remarks` for runtime constraints the caller must know:

```typescript
/**
 * Build the project report document from analysis data.
 *
 * @remarks Pure — no IO, no `process.*`. Environment facts are
 * injected via `ReportEnvironmentSnapshot`.
 */
```

Common `@remarks` patterns:
- `Pure — no IO, no side effects.`
- `No process.* access — env must be injected.`
- `Synchronous — does not await.`
- `Must be called after resolveProjectAnalysis.`

### `@param` and `@returns`

Add when the type name alone is ambiguous. Skip when it's obvious.

```typescript
/**
 * @param ctx - Core context with config, adapters, and resolved paths.
 * @param opts - Per-call options (target locale, flags).
 * @param host - Host callbacks for progress emission and run tracking.
 * @returns Payload for the JSON envelope and any diagnostic issues.
 */
```

### `@example` — sparingly

Only when the call shape is non-obvious. Skip for `fn(x)` patterns.

```typescript
/**
 * @example
 * ```ts
 * const ctx = createCoreContext({ config, adapters, env });
 * const result = await runGenerate(ctx, { target: 'fr', metadata: true });
 * ```
 */
```

---

## What NOT to do

- **Don't restate the TypeScript type.** The type signature is already visible. JSDoc adds intent.
- **Don't narrate code.** Comments like `// increment counter` or `/** Sets the value. */` add nothing.
- **Don't copy human message copy** into JSDoc. Reference issue codes by constant name (`ISSUE_SCAN_DYNAMIC_KEY_SITES`), not by the human string — it changes.
- **Don't add JSDoc to barrel files.** The re-exported module already has it.

---

## Core vs CLI

| Package | Audience | JSDoc focus |
|---------|----------|-------------|
| `packages/core/` | SDK consumers, other hosts | API contract, purity guarantees, return shape semantics |
| `packages/cli/` | Maintainers | Non-obvious orchestration logic, host hook wiring, why a certain rendering choice was made |
| `apps/` | Maintainers | Minimal — app code is self-documenting or covered by framework conventions |

---

## Task checklist

This file is the **how** for JSDoc. Tier-2 coverage gaps are closed opportunistically in the same PR as the touched module — no separate phase checklist.
