# Phase — Finite key set expansion

**Depth:** `fast` (locale-assisted) · `typed` (union hints, opt-in)  
**Perf budget:** locale pass +0–100 ms (tree walk on loaded source locale JSON, already in memory for validate)  
**Prerequisite:** E.1 `staticPrefix` / uncertain prefixes stable  
**Guardrails:** [`guardrails.md`](./guardrails.md) § Finite key evaluation · § Key buckets

---

## Problem

```ts
t(`seo.routes.${routeId}.title`);
// today: uncertainPrefix = 'seo.routes' — good
// want: candidate keys seo.routes.home.title, seo.routes.about.title, …
```

**Proving** `routeId` is finite from JS alone requires types or runtime evidence. Regex cannot soundly enumerate.

---

## Target behavior (two tracks)

### Track A — Locale-assisted (default v2, speed-safe)

When `uncertainPrefix` or `staticPrefix` is set and `uncertainKeyPolicy` allows:

1. Walk **source locale JSON** under that prefix.
2. Emit **`candidateKeys`** with `confidence: 'locale_inferred'` — **not** `provenKeys`.
3. Validate/report: optional warn “these locale leaves exist under prefix; dynamic call may need any of them.”

**Cost:** O(locale leaves under prefix) — typically small; reuse parsed locale from validate run.

### Track B — Typed unions (Tier 3, opt-in)

When `extractor.depth: 'typed'` and TS program available:

- `type RouteId = 'home' | 'about'` → enumerate union members.
- `as const` object keys → enumerate.
- Emit `candidateKeys` with `confidence: 'type_inferred'`.

**Cost:** TS program — **not** compatible with 500 ms default; explicit opt-in only.

---

## API shape (proposed, additive)

```json
{
  "kind": "template_interpolation",
  "classification": "mixed_const_runtime",
  "staticPrefix": "seo.routes",
  "runtimeSegments": ["routeId"],
  "candidateKeys": [
    { "key": "seo.routes.home.title", "confidence": "locale_inferred" },
    { "key": "seo.routes.about.title", "confidence": "locale_inferred" }
  ]
}
```

**Never** add candidate keys to cleanup delete-safe set without user policy change.

---

## Watch-outs

- Prefix mismatch (locale uses `seo.route` vs code `seo.routes`) — show mismatch issue, not wrong candidates.
- Large subtrees (1000+ keys) — cap `candidateKeys` count + `truncated: true` in JSON.
- Plural/gender dynamic segments — still runtime; prefix expansion only to first unresolved hole.

---

## Acceptance

- Fixture: prefix `app.nav` + locale has `app.nav.about`, `app.nav.home` → candidates listed.
- Parity: `provenKeys` unchanged vs today on same fixture.
- **Perf:** validate cold ≤ 900 ms with tier 2 on web-scale project.

---

## Related

- [`cross-file.md`](./cross-file.md) — richer static prefixes
- `docs/edge-cases/unsolved/policy-framework.md` — conservative defaults
