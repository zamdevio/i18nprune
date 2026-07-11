# Active sprint

**Shipped receipts:** [`shipped/`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | Placeholder sentinel repair | [`placeholder-sentinel-repair.md`](./placeholder-sentinel-repair.md) — **v1.0.1**: detect `__I18NPRUNE_*`, `sync` repair, `generate` guard |
| **Then** | Honest SDK tier labels | [`shipped/exports/tiers.md`](../shipped/exports/tiers.md) — start worker + share glue |
| **Then** | Subpath barrels | [`shipped/exports/program.md`](../shipped/exports/program.md) |
| **Paused** | Extractor v2 | [`extractor/README.md`](./extractor/README.md) — resume after v1.0.1 + first subpath barrel |
| **Then** | AST tier · extension · search | per extractor / extension READMEs |

**Kits v1.0.0** — [`shipped/kits/kits.md`](../shipped/kits/kits.md). **Export governance** — [`shipped/exports/governance.md`](../shipped/exports/governance.md). **v1.0.1** ships PS-0–PS-2 from placeholder-sentinel-repair. npm publish per [`agents/git.md`](../agents/git.md).

---

## Dependency chain

```txt
placeholder-sentinel v1.0.1 → … → kits v1 → export governance (shipped) → honest tiers → subpath barrels → root slim (2.0) → extractor v2 → …
```

Engineering maps: [`systems/README.md`](../systems/README.md).

---

## Guiding rules

- **CI-first:** `expgov validate` + parity tests on SDK/CLI changes.
- **One concern per PR** — scope from [`shipped/exports/tiers.md`](../shipped/exports/tiers.md) or [`shipped/exports/program.md`](../shipped/exports/program.md).
- **No bulk `stable.exact` dumps** — module-by-module reclassification + `@sdkTier`.
