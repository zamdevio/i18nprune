# Export governance (shipped)

**Theme:** expgov migration, npm v1 publish gate, `expgov validate` in CI.

| Milestone | Receipt | Artifacts |
|-----------|---------|-----------|
| **Governance bootstrap** | **`expgov`** + root `expgov.config.ts` + `.exports/cache/` (replaced `scripts/exports/`) | W26 — [`tooling/tooling.md`](../tooling/tooling.md) |
| **Publish preflight** | Tier classification + tsconfig ↔ npm parity; **`expgov validate` green**; [`.github/workflows/exports.yml`](../../../.github/workflows/exports.yml) | `fada5a3` |

**Live config:** [`expgov.config.ts`](../../../expgov.config.ts) · **Engineering map:** [`systems/exports.md`](../../systems/exports.md)

**npm v1:** publish allowed per [`agents/git.md`](../../agents/git.md) when validate is green in CI.

**Next:** honest tier labels — [`tiers.md`](./tiers.md) · barrel refactor — [`program.md`](./program.md)
