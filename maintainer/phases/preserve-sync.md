# Preserve + sync alignment — phase plan

**Status:** **shipped** (v1.0.3) — receipt [`shipped/locale/preserve-sync.md`](../shipped/locale/preserve-sync.md).  
**Tracker:** [`focus.md`](./focus.md) · **Related:** [`systems/commands/sync.md`](../systems/commands/sync.md) · extractor [`cross-file.md`](./extractor/cross-file.md) (parked).

**Goal (met):** `policies.preserve` (especially **`copyPrefixes`**) behaves as product docs imply — one config contract for cleanup, sync shape, and generate policy — without scan-anchor files for declared trees.

---

## Shipped

| Slice | Receipt |
|-------|---------|
| **P0** `copyPrefixes` → sync retain + hydrate | [`shipped/locale/preserve-sync.md`](../shipped/locale/preserve-sync.md) |
| **P0** `preserve.uncertainPrefixes[]` | same |
| **P2** Sync JSON retain reasons | same |
| **P2** Docs parity + migration note | same |
| Split semantics (documented, no rename) | `copy*` = verbatim · `uncertainPrefixes` = shape |

---

## Remaining (extractor track)

| # | Slice | Outcome |
|---|-------|---------|
| **P1** | **Cross-file const-map** | Imported `as const` roots fold into per-file map — [`extractor/cross-file.md`](./extractor/cross-file.md) |

---

## Related

- Finite-key expansion: [`extractor/finite-keys.md`](./extractor/finite-keys.md)
