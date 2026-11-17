# Bugs — open defect register

**Status:** living document.
**Scope:** defects found in shipping CLI / core behaviour. Not a roadmap — planned work lives in [`focus.md`](./focus.md) and the per-vertical phase docs.

This file is **generic and self-pruning**: a bug lives here only while it is open. When a fix ships, move the entry to [`shipped/`](../shipped/README.md) and delete it from this file. Do not accumulate fixed bugs here.

---

## How to use

### Adding a bug

1. Assign the next free id (`BUG-00N`), append it to the [index](#index), and add a full entry below.
2. Every entry needs: **expected**, **actual**, **repro**, **evidence**, **impact**, **fix sketch**, and a **regression test** to add with the fix.
3. `repro` must be runnable by someone who has never seen the consumer repo. Prefer a minimal config + one fixture file over "open the app and click".
4. Record the exact version(s) verified. Mark **both** if you tested more than one.
5. Cite `file:line` for every code claim. If the claim is behavioural, cite the command and its output.
6. If a bug is version-specific to a consumer's layout mode, say which mode (`flat_file`, `locale_directory` + `locale_per_dir`, …).

### Removing a bug

1. Fix + regression test land.
2. Cut a [shipped](../shipped/README.md) receipt; cross-link it from the release notes if the bug was user-visible.
3. Delete the entry here and its index row. A fixed bug must not linger.

### Legend

| Field | Values |
|---|---|
| **Severity** | `critical` (data loss / wrong output by default) · `high` (silent wrong behaviour, no data loss) · `medium` (documented contract not honoured) · `low` (polish) |
| **Status** | `open` · `in progress` · `blocked` |

---

## Index

| id | Title | Area | Severity | Status | Verified against |
|----|-------|------|----------|--------|------------------|

_No open defects._ `BUG-001`–`BUG-003` landed in v1.1.1 — see [`shipped/locale/cleanup-uncertain-protection.md`](../shipped/locale/cleanup-uncertain-protection.md). `BUG-004` / `BUG-005` fixed in-tree — see [`shipped/locale/deep-merge-nested-feature-bundle.md`](../shipped/locale/deep-merge-nested-feature-bundle.md).

---

## Candidates — not yet verified as bugs

Not defects until reproduced. Keep separate from the register above so it stays trustworthy.

| Observation | Why it may not be a bug |
|---|---|
| `locales dynamic` count unchanged (28) after the v1.1.0 extractor HOC §A work | Expected for **data-object** keys (`t(item.labelKey)`), which have no const map or hook to fold. Confirm on a hook/alias codebase before treating as a regression |
| `policies.preserve.copyPrefixes` is *verbatim* (skip MT) while dynamic families are translated | Not wrong (`sync --dry-run` reports 0 leaves filled from source), but it is the wrong flavour semantically. Now that declared `uncertainPrefixes` reaches `cleanup`, consumers should switch knobs; the split is **shape** (`uncertainPrefixes`) vs **verbatim** (`copyPrefixes`) |

---

## Performance follow-ups — not defects

**Not part of the defect register above.** These are **verified-correct** hot spots — reviewed and confirmed to produce no wrong output — that simply cost more than they should on large projects. They live here only because this is the file contributors check before starting work. A row leaves when its fix lands; no [`shipped/`](../shipped/README.md) receipt is needed unless the fix is user-visible enough to mention in release notes.

Verified against **v1.1.1** (`af8f30c`, `main`) by read-only review; **none change output** — the fix is always "hoist the lookup out of the loop", so a fix PR should be provably behaviour-preserving.

| id | Hot spot | Area | Cost | Fix sketch | Affected layouts |
|----|----------|------|------|------------|------------------|
| PERF-01 | `cleanup/stringPresence.ts:49` — `input.leaves.find((l) => l.path === key)` runs inside `for (const key of input.candidates)` | cleanup | `O(candidates × leaves)`. Note the dominant cost is still the per-key `hasStringPresence` probe (I/O); the `find` is the cheap part. | Build a `Map<path, leaf>` once before the loop; look up in `O(1)`. | all |
| PERF-02 | `cleanup/run.ts:102-104` — `keysToRemove.some((key) => hasLocaleLeafAtPath(raw, key))` per segment; `hasLocaleLeafAtPath` also walks the path depth. Same file is then re-read at line 107. | cleanup | `O(segments × keys × depth)`, plus a redundant second `readLocaleJsonFromContextSync` of the same file. | Read leaves once into a `Set<path>`; reuse the `raw` JSON already read in the filter instead of reading again in the `flatMap`. | multi-segment (`locale_directory`) |
| PERF-03 | `cleanup/sourceSurface.ts:40-42` — same `keys.some((key) => hasLocaleLeafAtPath(raw, key))` pattern | cleanup | `O(segments × keys × depth)` | Same `Set<path>` reuse as PERF-02. | multi-segment |
| PERF-04 | `quality/localeReport.ts:76-85` — `segmentTargets.find(...)` per segment per locale, plus `segments.find(...)` per relative path | quality | `O(locales × segments²)` | Index `segmentTargets` by `reportKey` into a `Map` once. | multi-segment |
| PERF-05 | `generate/localeTranslate.ts:245` — `input.sourceLeaves.find((row) => row.path === path)` per sentinel path | generate | `O(leaves × sentinelPaths)` | Build a `Map<path, leaf>` once. | all |
| PERF-06 | `policies/preserve.ts:101-102`, `policies/parity.ts:10-12` — `.some()` over `copyKeys` / `excludeKeys` for every path | policies | `O(paths × configKeys)`; config arrays are typically tiny, so effectively `O(paths)`. | Only worth it if a consumer ships large preserve/exclude lists — otherwise leave as-is. | all |

**Why these are not bugs (checked, not assumed):**

- PERF-04's `find` cannot cross-match locales: `reportKey` is the locale-qualified `relativePath` (`en.json` ≠ `fr.json`), so the first match is always the right one. `perFile` is keyed by the same value (`quality/englishIdentical.ts:25`).
- PERF-01's `?? key` fallback is intentional, and every candidate path originates from the same `leaves` array, so the lookup always hits.
- PERF-02's double read is a fresh read of an unchanged sync file — same bytes both times.

Add a benchmark or an assertion on operation count before claiming a fix "works" — a plain refactor test won't catch a regression back to the nested lookup.
