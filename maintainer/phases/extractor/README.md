# Extractor — phases hub

**Status:** **C.1 + E.1–E.6 + D.1 + HOC §A/§B + light-dataflow + cross-file + finite-keys Track A shipped** on `main`.  
**Close-out (before next release):** **AST/`typed`** (finite-keys Track B rides with AST) — then ship with serve close-out in one cut ([`../focus.md`](../focus.md)). Provider registry stays on hold.  
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
| **HOC §A** | Hook presets (`useTranslation` / `useTranslations` → `t`) + same-file one-hop aliases | [`shipped/extractor/hoc-a.md`](../../shipped/extractor/hoc-a.md) |
| **Light-dataflow** | Same-file assignment chains + mixed-template folding | [`shipped/extractor/light-dataflow.md`](../../shipped/extractor/light-dataflow.md) |
| **Cross-file** | Imported static string consts → fold templates | [`shipped/extractor/cross-file.md`](../../shipped/extractor/cross-file.md) |
| **Finite-keys A** | Locale-assisted `candidateKeys` under `staticPrefix` (never proven) | [`shipped/extractor/finite-keys-a.md`](../../shipped/extractor/finite-keys-a.md) |
| **HOC §B** | Opt-in prop destructuring helpers (`extractor.hoc`) | [`shipped/extractor/hoc-b.md`](../../shipped/extractor/hoc-b.md) |

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

**Known limits (no full dataflow):** multi-hop aliases (`const a = t; const b = a`), conditional assignment, higher-order / prop passing (`extractor.hoc` section B), renamed hook binds (`t: translate`). Tracked in inventory / [`hoc.md`](./hoc.md).

---

## Dependency chain (what ships next)

```txt
v2 close-out (this release cut):
  ~~finite-keys Track A~~ · ~~HOC §B~~
  → AST tier (`extractor.depth: 'typed'`) + finite-keys Track B
  → one release with serve close-out

after that release:
  → VS Code extension (own branch)
  → locale-only / search / …
  → provider registry (on hold until typed + extension stable)
```

**Sprint pointer:** [`../focus.md`](../focus.md) — close extractor + serve before the next release; extension after.

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
| **HOC** | [`hoc.md`](./hoc.md) | §A hooks, one-hop `tt = t` **shipped**; §B props / HOC `t` passing opt-in | `fast` |
| **Light dataflow** | [`light-dataflow.md`](./light-dataflow.md) | Same-file def-use without full AST — **shipped** (chains + mixed-template folding) | `fast` |
| **Cross-file** | [`cross-file.md`](./cross-file.md) | `export const NS` via static import graph — **shipped** (static string consts; tsconfig `paths` parked) | `fast` |
| **Finite keys** | [`finite-keys.md`](./finite-keys.md) | Track A locale-assisted **shipped**; Track B typed unions with AST | `fast` / `typed` |
| **AST tier** | [`ast-tier.md`](./ast-tier.md) | Opt-in TypeScript/SWC assist | `typed` |
| **Provider registry** | [`provider-registry.md`](./provider-registry.md) | **On hold** — non-JS file providers | After `typed` + extension |

**Suggested ship order:** ~~HOC §A~~ → ~~light-dataflow~~ → ~~cross-file~~ → ~~finite-keys A~~ → ~~HOC §B~~ → **AST tier** (incl. finite-keys B; close-out, one release) → extension → provider registry.

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
2. Close-out order: **AST/`typed`** (includes finite-keys Track B). Do not skip AST if the goal is “extractor done” for this release.
3. Keep parity discipline: `--json` envelope, issue codes, exit codes unchanged on refactors (additive JSON only). Default path stays `fast`; AST cost is opt-in only.

---

## Explicit non-goals (until provider-registry phase)

- Non-JS language providers (Python, etc.)
- External plugin loading / runtime provider download
- Full program dataflow on the default tier
