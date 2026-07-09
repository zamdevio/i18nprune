# Search command — phase plan

**Status:** **planned** — read-only op; ships after extractor baseline (C.1 / E / D) is stable; can overlap extractor v2 S.1+ index work.  
**Tracker:** [`active-phase.md`](./active-phase.md) · **Receipts:** [`shipped/README.md`](../shipped/README.md) (when shipped).  
**Implementation:** `packages/core/src/search/` (TBD) · CLI host · **Depends on:** project analysis + `KeyObservation` / `dynamicSites` from [`systems/extractor.md`](../systems/extractor.md).

**Goal:** Let operators look up **any dotted key path** (or fragment) across locale JSON and `src/` with explicit **lookup mode** and **advanced flags** — and **map every resolvable key to its call-site evidence** (literal, template-resolved, and **fully traced dynamic sites**) without stitching `validate`, `locales dynamic`, and manual `rg`.

---

## Problem

Today, answering “where is `navigation.items.dashboard` used?” or “what locale value does this key have?” requires stitching multiple commands:

| Need | Today |
|------|--------|
| Key in locale files | Open JSON or `jq` |
| Key referenced in `src/` | `validate`, `locales dynamic`, or manual `rg` |
| **All call sites for one key** | No single op — literal hits in analysis, dynamic sites listed separately, no key→site index |
| **Dynamic `t(variable)` provenance** | `locales dynamic` lists sites globally; you grep mentally for your key |
| Locale **value** appears in source | `cleanup --rg` (inverse — only for removal guard) |
| Partial / prefix keys | No first-class op |

`validate` / `missing` **warn** about dynamic sites but **do not enumerate usage per key**.  
`locales dynamic` lists **all** dynamic sites — it does not answer “show me every callsite that can reach `navigation.items.dashboard`”.

**Search** is the read-only op that **fully handles dynamic call sites** as first-class evidence (not a footnote).

---

## Product promise (dynamic sites)

Search **must** be documented and implemented as the command that **completely covers** translation call-site lookup:

| Site class | Search handles | How |
|------------|----------------|-----|
| **Literal** `t('a.b')` | Yes | `KeyObservation` `literal` → `resolvedKey` |
| **Template resolved** `` t(`${NS}.title`) `` | Yes | `template_resolved` after const-map fold |
| **Template partial** `` t(`${NS}.${id}.x`) `` | Yes | `template_partial` + `uncertainPrefix`; linked `dynamicRef` |
| **`template_interpolation`** | Yes | `staticPrefix` / `resolvedPrefix` / `runtimeSegments` / `classification` |
| **`non_literal`** `t(item.labelKey)` | Yes | Site row + optional `branchLiterals` / `resolvedViaConstAssignment` hints |
| **Commented** calls | Yes (flagged) | `kind: commented`, `isCommented`; default omit unless `--include-commented` |
| **Empty** `t()` | Yes (optional) | `kind: empty_call`; omit unless `--include-empty` |

**Not claimed:** runtime proof that a dynamic expression **always** evaluates to a given key (impossible without execution). Search reports **static evidence** and **prefix/branch hints** — same extractor model as validate, but **per-key** and **merged**, not a flat global dump.

Human + JSON copy must state this clearly:

> Search maps **extractor-proven** and **heuristic dynamic** call sites to keys. It fully indexes dynamic sites (non-literal, template interpolation, mixed const/runtime) — unlike `validate` / `missing`, which only count them.

---

## Proposed CLI surface

### Top-level

```bash
i18nprune search <query> [flags]
i18nprune search --map-callsites [flags]          # inventory: all resolvable keys → sites
i18nprune help search
```

`<query>` — dotted key path or fragment (e.g. `navigation.items.dashboard`, `navigation.items`, `seo.title`). Omitted when `--map-callsites` is set.

### Lookup modes (`--mode`)

| Mode | Alias | Searches | Primary data source |
|------|-------|----------|---------------------|
| `key` | (default) | Exact dotted path | Locale leaves + key index |
| `prefix` | | Keys under prefix | Same + prefix filter |
| `value` | | Locale string **values** | Locale leaves + optional `rg` |
| `calls` | `usage` | Call sites for the query key | Key observations + dynamic index |
| `dynamic` | | Dynamic sites overlapping query | Filtered `analysis.dynamicSites` |
| `all` | | Locale + calls + dynamic (deduped summary) | Full bundle |
| `map` | | **Key → all call sites** for query (or all keys with `--map-callsites`) | Built-in call-site index |

**Default:** `--mode key` when query contains no `*`; `--mode prefix` when query ends with `.` or user passes `--prefix`.  
**With `--map-callsites`:** default `--mode map` (ignore query unless provided as filter).

### Call-site mapping flags (built-in)

| Flag | Purpose |
|------|---------|
| `--map-callsites` | **Inventory mode** — emit `keyCallSiteIndex` for every **resolved** key in the current scan (literal + `template_resolved`). Optional query filters the key set. |
| `--callsites` | Alias for `--map-callsites` when used with a single-key query (same as `--mode map`). |
| `--include-dynamic` | **Default: true.** Attach dynamic sites whose `staticPrefix` / `resolvedPrefix` / hints overlap the key or prefix. |
| `--dynamic-only` | Only dynamic evidence (no literal/template rows) — debug dynamic flows. |
| `--include-commented` | Include `commented` dynamic sites (default: omit from active map, count in summary). |
| `--include-empty` | Include `empty_call` sites. |
| `--provenance` | Expand each hit with const substitutions, `branchLiterals`, `resolvedViaConstAssignment`, `runtimeSegments`, `classification`, `dynamicRef` file:line link. |
| `--link-partials` | **Default: true.** Join `template_partial` observations to paired `template_interpolation` dynamic rows via `dynamicRef` (same file:line). |

### Other advanced flags

| Flag | Purpose |
|------|---------|
| `--locale <code>` | Limit locale side to one code |
| `--target <code[,code]|all>` | Segment-aware locale read |
| `--exact` | Exact path match only |
| `--rg` / `--rg-value` | Ripgrep value probe (host hook; same adapter as cleanup) |
| `--json` | `CliJsonEnvelope` |
| `--top N` / `--full` | List window |
| `--advanced` | All secondary fields on every row |

---

## Built-in call-site index (core)

**Location:** `packages/core/src/search/callSiteIndex.ts` (pure fold over cached analysis).

Built once per `runSearch` from `ProjectAnalysis` (no rescan):

```ts
type CallSiteProvenance =
  | { kind: 'literal'; resolvedKey: string; filePath: string; line: number; functionName?: string; raw: string }
  | { kind: 'template_resolved'; resolvedKey: string; filePath: string; line: number; templateRaw: string; substitutions: ConstSubstitutionStep[] }
  | { kind: 'template_partial'; uncertainPrefix: string; filePath: string; line: number; templateRaw: string; dynamicRef?: { filePath?: string; line?: number } }
  | { kind: 'dynamic'; site: DynamicKeySite; overlapsKey: string; overlap: 'exact' | 'prefix' | 'hint' };

type KeyCallSiteEntry = {
  key: string;                    // resolved dotted path or prefix bucket
  proven: boolean;              // true for literal + template_resolved
  uncertain: boolean;             // true when only partial/dynamic evidence
  callSites: CallSiteProvenance[];
};

type KeyCallSiteIndex = Map<string, KeyCallSiteEntry>;
```

**Index rules:**

1. **Proven keys** — each `literal` / `template_resolved` observation → one `callSites` row; key = `resolvedKey`.
2. **Uncertain prefix keys** — `template_partial.uncertainPrefix` → bucket; query prefix match includes these sites.
3. **Dynamic overlap** — for each `DynamicKeySite`:
   - `template_interpolation`: attach to every resolved key equal to `staticPrefix` or nested under it; attach prefix bucket for `staticPrefix` itself.
   - `non_literal`: if `--provenance` and hints contain a literal matching query, attach with `overlap: 'hint'`.
4. **`dynamicRef` link** — when `template_partial` and `template_interpolation` share file:line, single merged row in human output (avoid duplicate lines).

**API:**

```ts
buildKeyCallSiteIndex(analysis: ProjectAnalysis, opts: CallSiteIndexOptions): KeyCallSiteIndex;
lookupCallSites(index: KeyCallSiteIndex, query: string, mode: 'exact' | 'prefix'): KeyCallSiteEntry[];
```

---

## Core design (`runSearch`)

**Location:** `packages/core/src/search/run.ts`.

**Inputs:**

```ts
type SearchRunOptions = {
  query?: string;
  mode: SearchMode;
  mapCallSites?: boolean;
  includeDynamic?: boolean;      // default true
  dynamicOnly?: boolean;
  includeCommented?: boolean;
  includeEmpty?: boolean;
  provenance?: boolean;
  linkPartials?: boolean;        // default true
  exact?: boolean;
  locale?: string;
  target?: string;
  top?: number;
  full?: boolean;
  advanced?: boolean;
};
```

Reuse `resolveProjectAnalysis(ctx)` — **no second scan** when cache warm.

**Outputs (`SearchJsonPayload`):**

```ts
{
  query: string | null;
  mode: SearchMode;
  summary: {
    localeHits: number;
    provenCallSites: number;
    dynamicCallSites: number;
    uncertainOnlyKeys: number;
    commentedOmitted: number;
  };
  locale?: Array<{ localeCode; path; value; segmentPath? }>;
  /** Single-key or filtered map */
  callSites?: CallSiteProvenance[];
  /** Present when --map-callsites or --mode map */
  keyCallSiteIndex?: Array<{
    key: string;
    proven: boolean;
    uncertain: boolean;
    callSiteCount: number;
    callSites: CallSiteProvenance[];
  }>;
  dynamicSites?: DynamicKeySite[];  // raw rows when --mode dynamic
  rgHits?: Array<{ path; line; sample }>;
  capabilities: {
    handlesDynamicSites: true;      // always true — explicit contract field in --json
    dynamicSiteKinds: DynamicKeySiteKind[];
  };
}
```

**Issues:**

- `i18nprune.search.no_matches` (info)
- `i18nprune.search.query_ambiguous_prefix` (warn)
- `i18nprune.search.ripgrep_unavailable` (warn)
- `i18nprune.search.key_uncertain_dynamic_only` (info) — key has only dynamic/prefix evidence, not proven literal

**Purity:** Core owns index + locale reads; `rg` via `SearchHostHooks`.

---

## CLI wiring

- `packages/cli/src/commands/search/` — thin host.
- Register next to `locales` / `validate` (read-only).
- Parity: `tests/parity/search.parity.json` + fixture with literal + `template_interpolation` + `non_literal` rows.

---

## Human output sketch

### Single key (dynamic fully shown)

```
i18nprune search navigation.items.dashboard --mode all

locale (en): navigation.items.dashboard = "Dashboard"
locale (zh-cn): navigation.items.dashboard = "仪表板"

call sites (3) — includes dynamic evidence:
  [proven]  (none — key not a literal in scan)

  [dynamic · prefix navigation.items]  src/lib/auth/navigation.ts:16
           object property in config array (non_literal)
           hint: labelKey: 'navigation.items.dashboard' is not scanned — use locale value / rg

  [dynamic · non_literal]  src/components/navigation/sidebar/logic.ts:88
           t(item.labelKey, …)
           multiline call · overlaps navigation.* via variable

  [dynamic · non_literal]  src/components/navigation/sidebar/view.tsx:42
           t(labelKey)  (JSX prop flows from parent)

coverage: dynamic sites fully indexed · proven literal: 0 · uncertain: 3
tip: policies.preserve.copyPrefixes for cleanup/generate when keys are config-driven
```

(Example uses generic dynamic rows — **no** hardcoded `labelKey` scanner in core; hints come from `--provenance` + user `rg` / future opt-in config. Inventory still maps **prefix** `navigation.items` from dynamic `staticPrefix` where applicable.)

### Inventory map

```
i18nprune search --map-callsites --prefix navigation.

keys (17) · proven call sites (0) · dynamic-linked (12)

navigation.items.dashboard
  dynamic (2): auth/navigation.ts:16 · sidebar/logic.ts:88
  locale: en, zh-cn

navigation.fallbackPage
  dynamic (1): sidebar/recents.ts:34
  locale: en, zh-cn
…
```

---

## Overlap / boundaries

| Existing op | Relationship |
|-------------|----------------|
| `validate` | Pass/fail gate; **does not** map keys → call sites |
| `locales dynamic` | Global dynamic dump; search **filters + maps per key** and merges literals |
| `missing` | Mutates JSON; search never writes |
| `cleanup --rg` | String-presence guard only |

Search **supersedes** the common “run `locales dynamic` then grep” workflow for key-specific lookups. It does **not** replace `validate` in CI gates.

**No project-specific scanners** (`labelKey`, `navigation.*`) in core — dynamic sites + prefix index + optional `rg` cover consumer patterns; `copyPrefixes` remains the config knob for cleanup/generate.

---

## Implementation slices (suggested order)

1. **S.1 — `buildKeyCallSiteIndex` + `mode=calls` / `mode=map`** — literal + template_resolved only; `--json`; parity test.
2. **S.2 — Dynamic merge** — `--include-dynamic` (default on), `template_interpolation` prefix overlap, `dynamicRef` linking, `capabilities.handlesDynamicSites` in JSON.
3. **S.3 — `--map-callsites` inventory** — all resolved keys + prefix buckets; `--prefix` filter; human table.
4. **S.4 — `--provenance` + `--include-commented`** — hints, groups, commented/empty toggles.
5. **S.5 — `mode=all` + locale side + `--rg-value`** — full merged UX.
6. **S.6 — Docs** — `docs/commands/search.md` with **“Dynamic sites: full coverage”** section; `maintainer/systems/commands/search.md`; optional `issues/search.md`; shipped receipt.

---

## Open questions

- Batch queries / stdin? **Defer** v1.
- Regex / fuzzy key match? **Defer** v1.
- Export index from `runReport` HTML? **Defer** — search JSON is the machine contract.
- SDK: `runSearch`, `buildKeyCallSiteIndex` on `@i18nprune/core` — **yes**.

---

## Docs targets (at ship)

- User: `docs/commands/search.md` — must include **Dynamic call sites** section stating full indexer behavior vs `validate` / `locales dynamic`.
- Maintainer: `maintainer/systems/commands/search.md`
- Issues: `docs/issues/search.md` (optional)
- Shipped receipt in [`shipped/README.md`](../shipped/README.md)
