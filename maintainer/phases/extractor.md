# Extractor — design reference (JS/TS-first)

**Status:** **Session C.1 shipped** — hardening slices complete; file kept for future work and [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md) cross-links.

**User docs:** [`docs/extractor/README.md`](../../docs/extractor/README.md) · **Maintainer map:** [`maintainer/systems/extractor.md`](../systems/extractor.md) · **Receipts:** [`shipped-slices.md`](./shipped-slices.md).

---

## Shipped (Session C.1)

- **C.1.1** — Import binding resolution (`extractor/bindings/`)
- **C.1.2** — Wire binding expansion into keySites + dynamic orchestrators
- **C.1.3** — Call-site lexical hardening (prose false-positive rejection in `shared/calls.ts`)
- **C.1.4** — Commented-call parity tests (dynamic pipeline)
- **C.1.5** — Edge-case inventory entries (`extractor-prose-first-arg-filter`, `extractor-reassignment-alias`, `extractor-hook-return-destructuring`)
- **C.1.6** — Methodology docs (user + maintainer)

---

## Decisions (locked for now)

- **Scope (language support):** JS/TS only (plus JS-like: `.vue`, `.svelte`).
- **Scope expansion:** other languages (e.g. Python) **only after** JS/TS extractor is "boringly stable".
- **Extensibility model:** provider-driven inside `@i18nprune/core` now; external plugins later (medium priority).
- **Core vs clients:** core is **data-only** — never prints; CLI/extension/API hosts handle presentation.
- **Restructure:** no heavy algorithm rewrite; prefer clearer grouping + export surfaces.

---

## Three-system model (reference)

| System | Responsibility | Module |
|--------|----------------|--------|
| **Import binding resolver** | Aliases, namespace imports, CJS destructuring | `extractor/bindings/` |
| **Scope/const tracker** | `const NS = 'app'` for template substitution | `extractor/constmap/` |
| **Expression evaluator** | Rebuild `` `${NS}.title` `` → `app.title` | `extractor/dynamic/rebuild.ts` |

**Known limits (no dataflow analysis):** reassignment aliases (`const tt = t`), conditional assignment, higher-order passing, hook return destructuring (`useTranslation()`). Documented in inventory + user docs.

---

## Future work (not started)

### Non-JS/TS languages

**Goal:** additional languages without destabilizing core.

**Prerequisites ("boringly stable"):** stable test matrix for `.js/.jsx/.ts/.tsx/.vue/.svelte`; stable literal/template/dynamic/comment handling; clear provider interface + registry.

### External plugins

**Goal:** third-party providers without patching core.

**Non-goals initially:** no runtime plugin loading during active migration; no remote code execution model.

**Plan:** provider interface + registry in core first; built-in providers in core; external loading mechanism later.

### Provider model (conceptual)

- **Inputs:** `{ filePath, text, functions, options }`
- **Outputs:** literal/template observations, dynamic key sites, optional metadata/capabilities
- **Registry:** deterministic selection, fallback when no provider matches

### Core ↔ client event contract (proposed)

Core emits machine-readable **`run.*`** events; clients subscribe for logging/UX/exit:

- `run.started` · `run.progress` · `run.warning` · `run.error` · `run.completed` · `run.failed`

Thread through 1–2 operations end-to-end before expanding providers.

---

## Where to start (when picking up future slices)

1. Triage open items in [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md) tagged to this doc.
2. Add provider/registry scaffolding only after JS/TS stability criteria are met.
3. Keep parity discipline: `--json` envelope, issue codes, exit codes unchanged on refactors.
