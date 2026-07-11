# Placeholder sentinel repair — `__I18NPRUNE_*` leak recovery

**Status:** **Active — ship as v1.0.1**  
**Priority:** **Now / important** — stable `generate` + trustworthy target locales  
**Tracker:** [`active-phase.md`](./active-phase.md)  
**Release:** **`v1.0.1`** (patch — detection, sync repair, generate guardrails)  
**Related:** [`shipped/extractor/fusion.md`](../shipped/extractor/fusion.md) (T.1 partial) · [`docs/issues/translate.md`](../../docs/issues/translate.md) (`placeholder_sentinel_mangled`) · `packages/core/src/shared/placeholders/`

---

## Problem

Machine translation can **persist mangled mask sentinels** into locale JSON instead of restoring `{{…}}` interpolation:

```text
Source (en):  "{{who}} · {{status}} · {{priority}}"
Target (ar):  "__I18NPRUNE_0__ · __I18NPRUNE_1__ · __I18NPRUNE_2__"
              (or spaced: "__ I18NPRUNE_0 __ · …")
```

**Observed in production** (CepatEdge `ar.json` dashboard `recentActivity.meta`) after **MyMemory** / weak MT backends. UI renders literal `__I18NPRUNE_*` — broken i18n.

**Existing mitigations (v1.0.0):**

| Layer | Today |
|-------|--------|
| `mask` / `restore` / `validateRestored` | Core placeholders module; spaced-variant tolerant |
| `isPlaceholderOnlyLeaf` + `placeholder_copy` | `generate` skips MT for placeholder-only leaves |
| T.1 fusion | Hardening in translate path — **does not** repair already-written leaks |
| `sync` | Merges shape from source — **does not yet** treat sentinel leaks as overwrite signal |
| `validate` / `quality` | No dedicated **`__I18NPRUNE_*`** scan + operator guidance |

**Gap:** No **shared** leak detector across `sync` + `generate`; read-only ops must not write; **sync** and **generate** need different repair strategies when write is allowed; **`generate --resume`** must treat leaked leaves as incomplete work.

---

## Shared sentinel leak system (v1.0.1)

**One core module** — both `sync` and `generate` call the same detection + classification APIs. Read-only commands use **detect only**; write-capable commands branch on **repair mode**.

```
                    ┌─────────────────────────────────────┐
                    │  @i18nprune/core/shared/placeholders │
                    │  sentinelLeak.ts (shared)            │
                    ├─────────────────────────────────────┤
                    │  containsPlaceholderSentinelLeak()   │
                    │  scanLocaleForSentinelLeaks()        │
                    │  classifyLeakRepair(path, src, tgt)  │
                    └──────────────┬──────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   validate / review         sync (write)            generate (write)
   quality / doctor          repairMode: copy        repairMode: translate
   detect → warn only         source → target         source → MT → target
```

| Command | Write? | On leak detected |
|---------|--------|------------------|
| `validate`, `review`, `quality`, `doctor` | **No** | `logger.warn` + suggest `sync` or `generate` |
| **`sync`** | **Yes** (default) | **Copy source leaf value → target** at same path (no MT) |
| **`generate`** | **Yes** | **Re-translate from source** via `translateLeaf` + mask/restore; write proper target-language string |
| `generate --resume` | **Yes** | Leaked paths = **not done**; resume re-queues them like missing/stale leaves |

**Metadata locales:** scan compares `.value` inside metadata wrappers; repairs update `.value` only, preserve confidence/source fields when possible (or mark `needsTranslationAgain` on generate path).

---

## Goals (v1.0.1)

| Goal | v1.0.1 | Later |
|------|--------|-------|
| **Shared** leak scan API used by sync + generate + validate | Yes | — |
| Detect stale `__I18NPRUNE_*` in target locale leaves | Yes | — |
| **Warn only** on read-only ops (no disk write) | Yes | — |
| **`sync` (write):** source key → target key | Yes | — |
| **`generate` (write):** auto-translate leaked paths + write | Yes | — |
| **`generate --resume`:** leaked leaves in pending set | Yes | — |
| `logger.notice` on sync copy-repair; notice/warn on generate re-translate | Yes | — |
| Translate layer prevents **new** leaks on write | Partial | Full fail-closed + provider scoring |
| Issue code + JSON envelope | Yes | CI gate recipes |
| **Kits** terminal MD output — dim secondary lines | Yes (PS-5) | Richer terminal renderer |

---

## Design principles

### 1. Warn on detect — read-only ops never write

**Commands:** `validate`, `review`, `quality`, `doctor` (locale pass), optional `report`.

Uses **`scanLocaleForSentinelLeaks`** from the shared module. When leaks found on a **target** locale:

```ts
logger.warn(
  'Target locale "<locale>" has <n> leaf(es) with stale placeholder sentinels (__I18NPRUNE_*). ' +
  'Quick fix (copy source structure): i18nprune sync --target <locale>  ' +
  'Proper fix (re-translate):       i18nprune generate --metadata --target <locale>',
  run,
);
```

- **No write** — operator picks `sync` (fast structure fix) or `generate` (localized copy).
- **`--json`:** issue `i18nprune.locale.placeholder_sentinel_leak` with `paths[]`, `localeCode`, `suggestion.commands[]`.

### 2. `sync` (write mode) — source → target copy

**Repair strategy:** `repairMode: 'copy_source'` — **no machine translation**.

During **`computeSyncedLocaleJson`** (shared scan runs on target **before** or **after** shape merge):

1. For each path where target `.value` (or string leaf) matches `containsPlaceholderSentinelLeak`.
2. If source has a **non-leak** string at the same path → **replace target with source value exactly**.
3. Preserves `{{who}} · {{status}}` structure; may leave **English** in target until `generate` runs — intentional for sync.

```ts
logger.notice(
  'Copied <n> source value(s) over placeholder sentinel leaks in <file> (sync repair).',
  run,
);
```

- **`--dry-run`:** `wouldRepair` count only.
- **`--json`:** `data.sentinelRepairs: { path, mode: 'copy_source', from, to }[]`.

**Not copied when:** source also leaks (warn); path missing on source (normal merge adds it).

### 3. `generate` (write allowed) — detect, re-translate, write

**Repair strategy:** `repairMode: 'retranslate'` — uses existing **`translateLeaf`** + **`mask`/`restore`/`validateRestored`**.

For each leaked target path (shared scan):

| Source leaf | Generate action |
|-------------|-----------------|
| `isPlaceholderOnlyLeaf(source)` | **`placeholder_copy`** — copy source string to target (no MT); fixes `{{…}}` tokens |
| Normal prose | **MT from source** → mask `{{…}}` → translate → restore → validate → **write target-language value** |
| MT still leaks after restore | **Fail-closed:** do not write leak; `logger.warn`; leave for `--resume` or manual fix |

```ts
logger.notice(
  'Re-translated <n> placeholder sentinel leak(s) in <locale> (<copy> copied, <mt> translated).',
  run,
);
```

- Runs in normal generate pass — leaked paths are **force-included** in the work queue even if target file has a non-empty (but broken) value.
- **`--dry-run`:** list paths that would be copy vs translate.
- **`--json`:** `data.sentinelRepairs: { path, mode: 'placeholder_copy' | 'translate', … }[]`.

**Default on** (v1.0.1): no extra flag required; optional `--no-repair-sentinel-leaks` to opt out.

### 4. `generate --resume` — leaked leaves stay “not done”

**Problem today:** resume may skip paths whose target leaf is non-empty (`__I18NPRUNE_*` counts as “filled”).

**v1.0.1 behavior:**

1. Shared scan marks leaked paths in generate **run state** / missing set (`sentinelLeakPaths: string[]`).
2. Initial `generate` and **`generate --resume`** both treat leaked paths as **pending** until repair succeeds.
3. After successful re-translate or `placeholder_copy`, path is marked complete in resume cache — **normal resume** continues with remaining missing keys only.
4. No special-case resume UX — operators just run `generate --resume` until clean; validate confirms zero leaks.

```text
generate --target ar        → fixes leaks + fills missing
generate --resume --target ar  → picks up failed/leaked + still-missing only
validate                    → warn if any leaks remain
```

### 5. Translate layer hardening (v1.0.1 + v1.1)

| Slice | Behavior |
|-------|----------|
| **v1.0.1** | `validateRestored` failure → no write; issue row; suggest sync/generate retry |
| **v1.1** | Provider reputation / block MyMemory for placeholder-heavy leaves; pre-flight mask audit |
| **v1.1** | `policies.parity.excludeValues` docs for ` · `, `—`, brand tokens |

---

## Core API (proposed)

**Module:** `packages/core/src/shared/placeholders/sentinelLeak.ts`  
(Re-exports `containsPlaceholderSentinelLeak` from `placeholders/index.ts`; shared by sync, generate, validate.)

```ts
export type SentinelRepairMode = 'copy_source' | 'placeholder_copy' | 'translate';

export interface SentinelLeakHit {
  path: string;
  value: string;
  localeCode: string;
}

export function containsPlaceholderSentinelLeak(text: string): boolean; // exists

/** Walk locale JSON (plain or metadata `.value` leaves). */
export function scanLocaleForSentinelLeaks(
  localeJson: unknown,
  opts?: { metadataLeaves?: boolean; localeCode?: string },
): SentinelLeakHit[];

/** Sync path: copy non-leak source strings over leaked targets. */
export function repairSentinelLeaksCopyFromSource(
  sourceLeaves: Map<string, string>,
  targetLeaves: Map<string, string>,
): { next: Map<string, string>; repairs: SentinelRepairRecord[] };

/** Generate path: classify how each leaked path should be repaired. */
export function planSentinelLeakGenerateRepairs(
  hits: SentinelLeakHit[],
  sourceLeaves: Map<string, string>,
): Array<{ path: string; mode: SentinelRepairMode; sourceValue: string }>;

/** Resume: true if path should stay in generate pending set. */
export function isSentinelLeakPending(
  targetValue: string | undefined,
): boolean;
```

**Issue code:** `i18nprune.locale.placeholder_sentinel_leak`  
**Severity:** `warning` on detect; `info` on repair notice (`sync` copy / `generate` re-translate).

---

## `sync` vs `generate` (operator cheat sheet)

| Need | Command | Result in target locale |
|------|---------|-------------------------|
| Fix `{{…}}` structure fast (may be English) | `i18nprune sync --target ar` | Same string as **source** at leaked paths |
| Proper **translated** copy + fix leaks | `i18nprune generate --metadata --target ar` | MT (or `placeholder_copy`) from source |
| Continue after partial generate | `i18nprune generate --resume --target ar` | Leaked + missing paths only |
| Check clean | `i18nprune validate` | `warn` if any `__I18NPRUNE_*` remain |

---

## Implementation slices

### PS-0 — Shared module + read-only detect

- [x] Add `sentinelLeak.ts` — scan, classify, `isSentinelLeakPending`  
- [x] Wire into `validate`, `review`, `quality` (detect only → `logger.warn`)  
- [x] JSON issue + dual suggestion (`sync` + `generate`)  
- [x] Tests: spaced `__ I18NPRUNE_0 __`, metadata `.value` leaves  
- [x] Docs: `docs/issues/locale.md`

### PS-1 — `sync` write repair (`copy_source`)

- [x] Call shared scan in sync apply path  
- [x] `repairSentinelLeaksCopyFromSource` after merge  
- [x] `logger.notice` per file when repairs > 0  
- [x] `--dry-run` → `wouldRepair`; JSON `mode: 'copy_source'`  
- [x] Tests: en `{{a}} · {{b}}`, ar leaked → sync → ar equals en at path  
- [x] Docs: `docs/commands/sync.md`

### PS-2 — `generate` write repair (`retranslate`)

- [ ] Shared scan → `planSentinelLeakGenerateRepairs`  
- [ ] Force leaked paths into translate queue (even if target non-empty)  
- [ ] `placeholder_copy` vs full `translateLeaf` + mask/restore  
- [ ] Fail-closed on post-MT leak; `logger.warn` + skip write  
- [ ] `logger.notice` with copy vs translate counts  
- [ ] JSON `sentinelRepairs` with `mode`  
- [ ] Tests extend `localeTranslate.test.ts` + resume fixture

### PS-2b — `generate --resume` integration

- [ ] Resume pending set uses `isSentinelLeakPending(targetValue)`  
- [ ] Generate cache/state: leaked path not marked complete until repair succeeds  
- [ ] Test: leak → partial generate fails path → `--resume` fixes → validate clean  
- [ ] Docs: `docs/commands/generate/README.md` resume + sentinel section

### PS-3 — Release v1.0.1

- [ ] Bump root + `packages/core` + `packages/cli` → **1.0.1**  
- [ ] Changelog + releases portal YAML — **two features** in this patch:
  - **Locale:** placeholder sentinel detect + `sync` copy repair + `generate` retranslate + resume pending leaks  
  - **Kits:** terminal MD output styling (dim secondary lines) — see PS-5  
- [ ] npm publish per [`agents/git.md`](../agents/git.md)  
- [ ] Receipt: [`shipped/locale/sentinel-repair.md`](../shipped/locale/sentinel-repair.md) (new) + kits row in [`shipped/kits/kits.md`](../shipped/kits/kits.md)

### PS-4 — Translate layer v1.1 (follow-up)

- [ ] Provider guard: downgrade/block backends with high leak rate on mask fixtures  
- [ ] Optional `validate` CI exit non-zero when leaks detected (opt-in flag)

### PS-5 — Kits `<cmd>` terminal MD output (v1.0.1 — kits output feat)

**Problem:** `i18nprune kits <subcmd>` builds markdown strings (`humanText`) for terminal + `--out *.md`, but everything prints at full brightness via `logger.plain` — hard to scan in the shell vs saved file.

**Applies to:** `kits dynamic`, `kits identical`, `kits honest`, `kits baseline`, `kits pr` — shared formatter in `packages/cli/src/commands/kits/lib/`.

**Goal:** When printing MD to **TTY** (not `--json`, not file-only `--out`), render structural/secondary lines with **`style.dim`** so primary headings and counts pop.

| Line kind | Terminal treatment | Example |
|-----------|-------------------|---------|
| `##` / `###` headings | **Bright** (default primary) | `## i18nprune Audit` |
| Bullet metrics (`- Missing …`) | **Primary** | `- Missing literal keys: **12**` |
| Blockquotes `>` | **`style.dim`** | `> Dynamic sites are non-literal…` |
| Footnotes / honesty notes | **`style.dim`** | `dynamicKeyHonestyLines()` pattern |
| `Docs: …` links | **`style.dim`** | trailing doc URL |
| Sample rows (file:line previews) | **Dim path/preview**; keep `[kind]` primary | `` `[template_partial]` `src/foo.tsx:12` `` |
| Separator blank lines | unchanged | |

**Implementation sketch:**

- [ ] Add `formatKitsTerminalMarkdown(md: string, run): string` — line classifier or small MD walker  
- [ ] Use in `writeKitsOutput` when `!run.json && !outPath && process.stdout.isTTY`  
- [ ] Reuse `style.dim` from `@/utils/style` (same as `packages/cli/src/commands/kits/lib/messaging.ts`)  
- [ ] `--out path.md` writes **plain** markdown (no ANSI) — file stays CI/PR-safe  
- [ ] `--json` unchanged  
- [ ] Optional: dim `validate`/`sync`/`generate` **suggestion** lines in sentinel leak `logger.warn` (same style module)  
- [ ] Tests: snapshot or strip-ansi assert dim codes on blockquote lines only  
- [ ] Docs: `docs/commands/kits/README.md` — “Terminal output” subsection  

**Release note (v1.0.1):** *Kits — improved terminal readability for markdown audit output (dim secondary lines).*

```bash
i18nprune kits pr          # terminal: layered contrast
i18nprune kits pr -o pr.md # file: clean markdown, no ANSI
```

---

## Operator playbook (consumer repos e.g. CepatEdge)

### Detect

```bash
i18nprune validate
```

Expect **`warn`**: stale sentinels + hints for **sync** (copy) and **generate** (re-translate).

### Quick structure fix (sync — copy source → target)

```bash
i18nprune sync --metadata --target ar
```

Expect **`notice`**: N paths copied from `en`. Target may show English `{{who}} · …` until generate — **placeholders work in UI**.

### Proper localized fix (generate — translate + write)

```bash
i18nprune generate --metadata --target ar
```

Expect **`notice`**: leaked paths re-translated; `{{…}}` preserved in Arabic (or target lang).

### Continue a long run

```bash
i18nprune generate --resume --metadata --target ar
```

Leaked paths stay pending until fixed — resume does not skip them as “already filled”.

### Prevent recurrence (project config)

```ts
// i18nprune.config.ts
policies: {
  preserve: { copyKeys: ['app.brand', 'common.dash'], copyPrefixes: [...] },
  parity: {
    excludeValues: ['—', 'CepatEdge', '{{pageTitle}} · {{siteName}}', ' · '],
  },
},
```

Prefer **Google / DeepL** over **MyMemory** for projects with heavy `{{…}}` format strings.

---

## Acceptance (v1.0.1)

| Case | Expected |
|------|----------|
| `ar.json` with `__ I18NPRUNE_0 __` | `validate` → `warn`, no file change |
| **`sync --target ar`** | Leaked paths = **source strings** (copy); `notice` logged |
| **`generate --target ar`** | Leaked paths **re-translated**; no `__I18NPRUNE_*` written |
| `placeholder_only` source (`{{who}} · {{status}}`) | `generate` → `placeholder_copy` or MT with restored `{{…}}` |
| **`generate --resume`** after failed leak write | Re-queues leaked paths; completes on retry |
| Spaced + tight sentinel variants | Shared scan detects both |
| `--json` | `sentinelRepairs[].mode` = `copy_source` \| `placeholder_copy` \| `translate` |
| **`kits pr`** (TTY) | Blockquotes + doc lines **dim**; headings/metrics primary |
| **`kits pr -o out.md`** | Plain markdown file, no ANSI |

---

## v1.0.1 release bundle

| Feature | Slice | Receipt doc |
|---------|-------|-------------|
| Placeholder sentinel detect + repair | PS-0 – PS-2b | `shipped/locale/sentinel-repair.md` |
| **Kits terminal MD output (dim)** | PS-5 | `shipped/kits/kits.md` (v1.0.1 row) |

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-10 | Phase opened — v1.0.1 target; active sprint |
| 2026-07-10 | Shared system; sync=copy_source, generate=retranslate, resume pending leaks |
| 2026-07-10 | PS-5 kits `<cmd>` terminal MD — dim secondary lines; v1.0.1 kits output feat |
