# Phase: Key reference unification, preserve module, and regex documentation

**Status:** completed (core + CLI + docs). **`cleanup --ask`** shipped — see [interactive-key-confirmation.md](./interactive-key-confirmation.md) and the [active sprint hub](./active-phase.md).

## Goal

Disprove the mismatch: *“rich signals exist, but policy and command behavior are not unified.”* Align CLI and core around:

- **`core/preserve`** — single implementation of catalog preserve rules (`copyKeys` / `copyPrefixes`) and helpers to filter candidate paths.
- **`reference` config** — defaults + per-command overrides (`cleanup`, `fill`, `sync`, `generate`) for how **literal vs uncertain** key evidence is interpreted; schema designed for forward-compatible extension (`passthrough` where appropriate).
- **`buildKeyReferenceContext`** — one builder combining **keySites** + **dynamic** scans (with commented-call filtering and partial/prefix extraction).
- **Commands** — cleanup, fill, and sync use the same resolved reference policy + context; fill respects **preserve** and **uncertain prefixes** by default.
- **Ripgrep** — string-presence evidence (not key proof); structured hits (`file:line`) for warnings; `guard` / `warn` / `off`.
- **Honest documentation** — [Detection limits](../regex/README.md#detection-limits), [extraction](../regex/extraction.md), [key-sites-and-dynamic](../regex/key-sites-and-dynamic.md) (linked from CLI docs, web `/api`, and exports).

## UX / DX principles locked in

| Audience | What we optimize for |
|----------|----------------------|
| **CLI users** | Predictable defaults (`reference` + preserve); destructive commands fail closed in CI without `--yes`; logs explain *why* a key was skipped (uncertain prefix, rg hit). |
| **Integrators (`/core`)** | Same types and merge rules as CLI; exports in `@zamdevio/i18nprune/core` include `canAsk`, `isPreservePath`, `buildKeyReferenceContext`, `resolveReferenceConfig`. |
| **Docs** | No fake accuracy percentages; limits and indirection patterns are explicit; cross-links to `docs/regex/*`. |

## Decisions (frozen for this phase)

| Topic | Decision |
|--------|-----------|
| Config layout | Top-level **`reference`** sibling to **`policies`**: `reference.defaults` + `reference.commands.<name>` partial overrides, deep-merged per command. |
| Fill | **`respectPreserve`** default `true`; uncertain **`protect`** skips fills under uncertain key prefixes (same prefix set as cleanup). |
| Sync | When **`uncertainKeyPolicy`** is **`protect`**, merge + prune keep extra target keys under **uncertain prefixes**. |
| rg | **`stringPresence`**: `guard` / `warn` / `off`; JSON locations for human detail only. |
| Accuracy | Honest narrative only; see [Detection limits](../regex/README.md#detection-limits). |

## Implementation checklist

- [x] `packages/cli/src/core/preserve/` — `isPreservePath`, `filterOutPreservedPaths`, `partitionPreserve`.
- [x] `isPreservePath` only from `core/preserve` (not re-exported from `core/json`).
- [x] `packages/cli/src/core/reference/` — `resolveReferenceConfig`, `buildKeyReferenceContext`, `pathUnderAnyUncertainPrefix`.
- [x] `packages/cli/src/core/ask/` — `canAsk` (`gate.ts`); interactive gate used by generate, cleanup, fill, locales delete, missing.
- [x] KeySites: comment skip; **`uncertainPrefix`** on `template_partial`.
- [x] `mergeToTemplateShape` + `pruneToTemplateShape` — `uncertainKeepPrefixes` for sync.
- [x] Wire **cleanup**, **fill**, **sync**; rg JSON locations + `stringPresence`.
- [x] Config schema + `DEFAULT_CONFIG` + `defineConfig` merge for `reference`.
- [x] Tests: preserve, reference resolve, merge/prune, schema, `canAsk` gate.
- [x] Docs: `docs/regex/*`, this phase file, cross-links in exports and web (see below).

## Documentation map

| Doc | Purpose |
|-----|---------|
| `docs/regex/README.md` | Overview + **Detection limits** anchor |
| `docs/regex/extraction.md` | Call extraction + **known gaps** table |
| `docs/regex/key-sites-and-dynamic.md` | Pipelines + merged-text caveats |
| `docs/regex/ripgrep.md` | String presence vs static keys |
| `docs/cli/prompts/README.md` | Per-command vs shared prompt layout |
| `docs/phases/interactive-key-confirmation.md` | **`--ask`** / grouping / `--yes` precedence (planned) |
| `docs/exports/core.md` | Links detection limits for API users |

## Completion criteria

- [x] Tests passing (`pnpm exec vitest run packages/cli`).
- [x] Single `isPreservePath` in `core/preserve`.
- [x] Honest limits documented and linkable (`#detection-limits` on hosts that slugify headings).

## Artifacts

| Area | Location |
|------|-----------|
| Preserve | `packages/cli/src/core/preserve/index.ts` |
| Ask gate | `packages/cli/src/core/ask/gate.ts` |
| Reference config + merge | `packages/cli/src/core/reference/resolve.ts`, `types/config/reference.ts`, `config/schema.ts` |
| Key context | `packages/cli/src/core/reference/context.ts`, `paths.ts` |
| Public exports | `packages/cli/src/exports/core.ts` |
