# Preserve + sync alignment — phase plan

**Status:** **now** — dogfooded from [CepatEdge](https://github.com/zamdevio/CepatEdge) (`apps/web`); config + anchors work around core gaps today.  
**Tracker:** [`focus.md`](./focus.md) · **Receipts:** [`shipped/README.md`](../shipped/README.md) (when shipped).  
**Related systems:** [`systems/commands/sync.md`](../systems/commands/sync.md) · [`systems/commands/cleanup.md`](../systems/commands/cleanup.md) · [`systems/commands/generate.md`](../systems/commands/generate.md) · extractor [`cross-file.md`](./extractor/cross-file.md).

**Goal:** Make `policies.preserve` (especially **`copyPrefixes`**) behave the way product docs imply — **one config contract** for cleanup, **sync shape**, and **generate policy** — so consumer repos never need scan-anchor files or hand-copied locale JSON.

---

## Shipped

| Slice | Receipt |
|-------|---------|
| — | — |

---

## Problem (dogfood: CepatEdge)

Consumer repos with dynamic i18n (`t(item.labelKey)`, `` t(`seo.routes.${id}`) ``, cross-file `` `${i18nKey…}.title` ``) hit a **split brain**:

| Knob | Cleanup | Sync prune retain | Generate `--resume` |
|------|---------|-------------------|---------------------|
| **`policies.preserve.copyPrefixes`** | ✅ protects unused removal | ❌ **not wired** to `uncertainKeepPrefixes` | ✅ skips MT when `respectPreserve: true` |
| **Auto uncertain prefixes** (scan) | ✅ when `protect` | ✅ retains target branches | ✅ skips MT when `protect` |

**Symptoms:**

- `copyPrefixes: ['navigation.']` → cleanup safe, **sync still drops ~60 live keys** (settings tree) because they are not in `resolvedKeys` template.
- Docs say preserve applies to **sync**; implementation only retains **auto-detected** uncertain prefixes on prune.
- Cross-file `import { i18nKey } from './keys'` → `` t(`${SETTINGS}.title`) `` invisible to scan (same-file const works).
- `--rg` on cleanup skips dead keys when **English value** appears elsewhere (false negative).

**Workarounds today:** `i18npruneDynamicAnchors.ts` (scan-only template anchors) + per-command `reference.commands.generate` overrides + literal registries (`activityActionLabel.ts`).

---

## Remaining (promote order)

| # | Slice | Outcome | Core touchpoints |
|---|-------|---------|------------------|
| **P0** | **`copyPrefixes` → sync retain + hydrate** | Sync merge/prune treats `copyPrefixes` / optional `uncertainPrefixes` like auto uncertain roots; **copy missing paths from source** into targets (not only retain existing extras). | `sync/apply.ts`, `mergeToTemplateShape`, `buildKeyReferenceContext`, config schema |
| **P0** | **Config `preserve.uncertainPrefixes[]`** | Declare roots without anchor files (`navigation.items`, `pages.domain.shared.settings.appearance`, …). | `policies.preserve` schema, reference context builder |
| **P1** | **Cross-file const-map** | Imported `as const` string roots (e.g. shared `i18nKey` module) fold into per-file effective map. | Extractor — see [`extractor/cross-file.md`](./extractor/cross-file.md) |
| **P1** | **Split preserve semantics** | `verbatimPrefixes` / `copyKeys` (never MT) vs `shapePrefixes` (keep in JSON, allow `generate --resume`). | `generate/resume/eligibleResumeLeaves.ts`, docs |
| **P2** | **Sync JSON clarity** | When prune ≠ tip “extra” counts, emit retained paths + reason (`uncertainPrefix`, `copyPrefix`) in `--json`. | `runSync`, issue `scan_extras_retained` upgrade |
| **P2** | **Docs parity** | Align `docs/config/policies.md` + `docs/commands/sync.md` with actual merge/prune dataset (`resolvedKeys ∩ source` vs full JSON). | Docs only |

---

## Acceptance (phase done)

1. **Fixture repo** (minimal + CepatEdge-shaped): `copyPrefixes: ['navigation.items.']` only — **no anchor file** — `sync --target all` keeps/hydrates full nav tree from source; `cleanup --dry-run` on source does not flag nav keys unused.
2. **Settings fixture:** cross-file `i18nKey` import → scan sees `` pages.domain.shared.settings.* `` OR config prefix hydrates without anchors.
3. **`generate --resume`:** shape prefixes translatable; brand/`copyKeys` still verbatim.
4. **Regression:** existing uncertain-prefix behavior (`seo.routes.${id}`) unchanged; parity tests on SDK/CLI `--json`.
5. **Consumer doc:** migration note — drop scan-anchor pattern when on fixed version.

---

## Non-goals

- Runtime execution / proving dynamic expressions always evaluate to a key.
- Replacing literal registries for **open-ended** ids (`` actions.${unknownId} ``) — raw fallback remains correct.
- Full-locale blind mirror (`en.json` every path regardless of scan) — still schema-first; this phase expands **declared preserve** coverage.

---

## Agent / operator capability (when shipped)

With preserve-sync fixed, an agent on a large SPA can reliably:

| Task | Command flow |
|------|----------------|
| Add product copy | Edit source locale → `sync --target all` |
| Fill targets | `generate --resume --all` (dynamic namespaces included when config declares prefixes) |
| Gate CI | `validate` · `quality` · `kits identical` |
| Remove dead keys | `cleanup --dry-run` on source (no anchor file maintenance) |
| Triage drift | `locales ls` vs `kits identical` vs parity excludes |

**No:** hand-copy target JSON, locale Python scripts, or repo-specific scan-anchor files for standard dynamic patterns.

---

## Related

- Extractor v2 cross-file: [`extractor/cross-file.md`](./extractor/cross-file.md)
- Finite-key expansion under prefix: [`extractor/finite-keys.md`](./extractor/finite-keys.md)
- CepatEdge consumer notes: upstream handoff only (not committed here)
