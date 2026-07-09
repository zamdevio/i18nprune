# Extractor — phases hub

**Status:** **C.1 + E.1–E.6 + D.1 shipped** on `main` — v2 accuracy program is the active extractor track.  
**Implementation:** `packages/core/src/extractor/**` · **Engineering map:** [`maintainer/systems/extractor.md`](../../systems/extractor.md) · **Receipts:** [`shipped/README.md`](../../shipped/README.md).

**User docs:** [`docs/architecture/extraction/`](../../../docs/architecture/extraction/README.md) · **Inventory:** [`docs/edge-cases/unsolved/inventory.md`](../../../docs/edge-cases/unsolved/inventory.md).

**Architecture:** [`architecture.md`](./architecture.md) · **Guardrails (every extractor PR):** [`guardrails.md`](./guardrails.md).

---

## Shipped (do not re-implement)

| Track | Slices | Receipt |
|-------|--------|---------|
| **C.1** | C.1.1 bindings · C.1.2 orchestrator wiring · C.1.3 prose first-arg filter · C.1.4 commented-call parity · C.1.5 inventory rows · C.1.6 methodology docs | [`shipped/extractor/c1.md`](../../shipped/extractor/c1.md) |
| **E.1–E.6** | Mixed-template fusion, const-map, non-literal hints, lexical safety, comment parity, `locales dynamic` groups | [`shipped/extractor/fusion.md`](../../shipped/extractor/fusion.md) |
| **D.1** | Active vs commented dynamic counts — `dynamicActive` / `dynamicCommented` in analysis + CLI/JSON | [`shipped/extractor/fusion.md`](../../shipped/extractor/fusion.md) · [`docs/dynamic/README.md`](../../../docs/dynamic/README.md) |

### C.1 detail

- **C.1.1** — Import binding resolution (`extractor/bindings/`)
- **C.1.2** — Wire binding expansion into keySites + dynamic orchestrators
- **C.1.3** — Call-site lexical hardening (prose false-positive rejection in `shared/calls.ts`)
- **C.1.4** — Commented-call parity tests (dynamic pipeline)
- **C.1.5** — Edge-case inventory entries (`extractor-prose-first-arg-filter`, `extractor-reassignment-alias`, `extractor-hook-return-destructuring`)
- **C.1.6** — Methodology docs (user + maintainer)

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| **Language scope (default)** | JS/TS + JS-like `.vue` / `.svelte` on `extractor.depth: 'fast'` |
| **Core vs clients** | Core is data-only — CLI/extension hosts present |
| **Default engine** | Regex-first — no AST on cold path unless `extractor.depth: 'typed'` |
| **Config knob (v2)** | `extractor.depth`: `fast` (default) · `balanced` · `typed` — see [`architecture.md`](./architecture.md); not `extractor.mode` (`search --mode` owns lookup modes) |
| **Provider registry** | **On hold** — see [`provider-registry.md`](./provider-registry.md); ships only after **AST tier + extension** are released and stable |
| **Restructure** | No heavy algorithm rewrite; clearer grouping + export surfaces |

---

## Three-system model (shipped baseline)

| System | Responsibility | Module |
|--------|----------------|--------|
| **Import binding resolver** | Aliases, namespace imports, CJS destructuring | `extractor/bindings/` |
| **Scope/const tracker** | `const NS = 'app'` for template substitution | `extractor/constmap/` |
| **Expression evaluator** | Rebuild `` `${NS}.title` `` → `app.title` | `extractor/dynamic/rebuild.ts` |

**Known limits (no full dataflow):** reassignment aliases (`const tt = t`), conditional assignment, higher-order passing, hook return destructuring (`useTranslation()`). Tracked in inventory.

---

## Dependency chain (what ships next)

```txt
v2 extractor (`fast` heuristics: HOC → light-dataflow → cross-file → finite-keys)
  → search command
  → `balanced` / `typed` depths + incremental cache
  → VS Code extension (released stable)
  → provider registry (on hold)
```

**Sprint pointer:** [`../active-phase.md`](../active-phase.md) — extractor v2 is the extractor focus; extension follows AST.

---

## Performance budget (v2 program)

**Reference:** ~316 `.ts`/`.tsx` files · ~1,177 key observations · ~88 dynamic sites · **~511–555 ms** cold today (`validate --no-cache`).

| Depth | Budget (cold, reference project) |
|-------|----------------------------------|
| **`fast`** | ≤ ~900 ms as full heuristic stack lands; **CI parity frozen on `fast`** |
| **`balanced`** | Between `fast` and `typed`; escalation caps TBD |
| **`typed`** | User accepts seconds-scale; incremental cache required |

Rules: lazy skips inside `fast`; indexes built once per scan; dogfood benchmark on hot-path PRs. Full model: [`architecture.md`](./architecture.md).

---

## Phase index (v2 — planned)

| Phase | Doc | Summary | Depth |
|-------|-----|---------|-------|
| **HOC** | [`hoc.md`](./hoc.md) | Hooks, one-hop `tt = t`, props / HOC `t` passing | `fast` |
| **Light dataflow** | [`light-dataflow.md`](./light-dataflow.md) | Same-file def-use without full AST | `fast` |
| **Cross-file** | [`cross-file.md`](./cross-file.md) | `export const NS` via static import graph | `fast` |
| **Finite keys** | [`finite-keys.md`](./finite-keys.md) | Locale-assisted + optional typed unions | `fast` / `typed` |
| **AST tier** | [`ast-tier.md`](./ast-tier.md) | Opt-in TypeScript/SWC assist | `typed` |
| **Provider registry** | [`provider-registry.md`](./provider-registry.md) | **On hold** — non-JS file providers | After `typed` + extension |

**Suggested ship order:** HOC → light-dataflow → cross-file → finite-keys → HOC props (opt-in) → AST tier → extension → provider registry.

---

## Files in this folder

| File | Role |
|------|------|
| `README.md` | This hub — shipped receipts, sequencing, perf budget |
| `architecture.md` | Engines, normalizer, incremental cache, parity model |
| `guardrails.md` | Identity, safety, stop conditions, PR checklist |
| `hoc.md` · `light-dataflow.md` · `cross-file.md` · `finite-keys.md` | v2 accuracy phases |
| `ast-tier.md` | Opt-in typed assist phase |
| `provider-registry.md` | Deferred non-JS registry (on hold) |
| `REVIEW.md` | Maintainer review copy — before/after analysis |

---

## Where to start (next slice)

1. Triage open inventory items tagged to this hub ([`inventory.md`](../../../docs/edge-cases/unsolved/inventory.md)).
2. Pick the next row from **Phase index** — start with **HOC** unless a smaller inventory fix is blocking.
3. Keep parity discipline: `--json` envelope, issue codes, exit codes unchanged on refactors (additive JSON only).

---

## Explicit non-goals (until provider-registry phase)

- Non-JS language providers (Python, etc.)
- External plugin loading / runtime provider download
- Full program dataflow on the default tier
