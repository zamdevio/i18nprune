# Extractor — phases hub

**Status:** Heuristic v2 **shipped** (C.1 · E · D · HOC §A/§B · light-dataflow · cross-file · finite-keys Track A).  
**Open:** [`ast.md`](./ast.md) → [`registry.md`](./registry.md) (Python first after TS/JS typed path).  
**Implementation:** `packages/core/src/extractor/**` · **Engineering map:** [`maintainer/systems/extractor.md`](../../systems/extractor.md) · **Receipts:** [`shipped/README.md`](../../shipped/README.md).

**User docs:** [`docs/architecture/extraction/`](../../../docs/architecture/extraction/README.md) · **Inventory:** [`docs/edge-cases/unsolved/inventory.md`](../../../docs/edge-cases/unsolved/inventory.md).

**Architecture:** [`architecture.md`](./architecture.md) · **Guardrails (every extractor PR):** [`guardrails.md`](./guardrails.md).

---

## Shipped (do not re-implement)

| Track | Receipt |
|-------|---------|
| C.1 · E.1–E.6 · D.1 | [`shipped/extractor/c1.md`](../../shipped/extractor/c1.md) · [`fusion.md`](../../shipped/extractor/fusion.md) |
| HOC §A / §B | [`hoc-a.md`](../../shipped/extractor/hoc-a.md) · [`hoc-b.md`](../../shipped/extractor/hoc-b.md) |
| Light-dataflow · cross-file | [`light-dataflow.md`](../../shipped/extractor/light-dataflow.md) · [`cross-file.md`](../../shipped/extractor/cross-file.md) |
| Finite-keys Track A | [`finite-keys-a.md`](../../shipped/extractor/finite-keys-a.md) |

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| **Language scope (default)** | JS/TS + JS-like `.vue` / `.svelte` on `extractor.depth: 'fast'` |
| **Core vs clients** | Core is data-only — CLI/extension hosts present |
| **Default engine** | Regex-first — no AST on cold path unless `extractor.depth: 'typed'` |
| **Config knob** | `extractor.depth`: `fast` (default) · `balanced` · `typed` — see [`architecture.md`](./architecture.md) |
| **Registry** | After AST — see [`registry.md`](./registry.md); Python first, then other languages |

---

## Open chain

```txt
AST (`ast.md`) — opt-in typed + finite-keys Track B
  → registry (`registry.md`) — Python first, then other langs
```

**Sprint pointer:** [`../focus.md`](../focus.md).

---

## Performance budget

**Reference:** ~316 `.ts`/`.tsx` files · ~1,177 key observations · ~88 dynamic sites · **~511–555 ms** cold today (`validate --no-cache`).

| Depth | Budget (cold, reference project) |
|-------|----------------------------------|
| **`fast`** | ≤ ~900 ms; **CI parity frozen on `fast`** |
| **`balanced`** | Between `fast` and `typed`; escalation caps TBD |
| **`typed`** | User accepts seconds-scale; incremental cache required |

Full model: [`architecture.md`](./architecture.md).

---

## Files in this folder

| File | Role |
|------|------|
| `README.md` | This hub |
| `architecture.md` | Engines, normalizer, incremental cache, parity |
| `guardrails.md` | Identity, safety, stop conditions, PR checklist |
| `ast.md` | Opt-in typed assist + Track B |
| `registry.md` | Non-JS providers (after AST; Python first) |

---

## Explicit non-goals (until registry)

- Non-JS language providers (Python, etc.)
- External plugin loading / runtime provider download
- Full program dataflow on the default tier
