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
| [BUG-001](#bug-001) | Declared `policies.preserve.uncertainPrefixes` is ignored by `cleanup` | `cleanup` · `policies.preserve` | medium | open | v1.0.2, v1.1.0 |
| [BUG-002](#bug-002) | `cleanup --target <locale>` drops all scan-derived uncertain-prefix protection | `cleanup` · `--target` | **high** | open | v1.0.2, v1.1.0 |
| [BUG-003](#bug-003) | `kits identical` resolves source paths without the locale segment under `locale_per_dir` | `kits identical` · locale layout | high | open | v1.0.2, v1.1.0 |

All three were found in the same consumer session (`VitaCaafimaad`, `apps/web`: `locale_directory` + `locale_per_dir`, `en` source, `so` target) and are reproducible there. They are layout-adjacent but independent.

---

## BUG-001

### Declared `policies.preserve.uncertainPrefixes` is ignored by `cleanup`

| | |
|---|---|
| **Severity** | medium — documented contract not honoured; no data loss once `copyPrefixes` is used |
| **Status** | open |
| **Area** | `cleanup` · `policies.preserve` |
| **Found** | 2026-10-12 |
| **Verified against** | v1.0.2 and v1.1.0 (behaviour identical) |
| **Code** | `packages/core/src/shared/reference/context.ts:57-61`; `packages/core/src/policies/preserve.ts:25,54,71-72` |
| **Docs** | `docs/config/policies.md` — the `policies.preserve` table |

**Expected.** `docs/config/policies.md` states, in the Cleanup column of the `uncertainPrefixes` row:

> Protected when uncertain-key policy is `protect` / `warn_only`

and adds:

> Prefer declaring `uncertainPrefixes` … instead of scan-only anchor files once you are on **≥ 1.0.3**.

So a config-declared `uncertainPrefixes` root should keep every path beneath it out of the `cleanup` candidate set.

**Actual.** Declared `uncertainPrefixes` has **no effect on `cleanup`**. The uncertain-prefix list is built only from scan anchors and dynamic call sites:

```ts
// packages/core/src/shared/reference/context.ts:57-61
export function buildKeyReferenceContextFromLiteralUsageAndDynamicSites(
  usage: ProjectLiteralKeyUsage,
  dynamicSites: readonly DynamicKeySite[],
  eff: EffectiveReferenceConfig,
): KeyReferenceContext {
  const uncertainPrefixes: string[] = [];
  for (const p of usage.uncertainPrefixes) pushUnique(uncertainPrefixes, p);
  collectUncertainPrefixesFromDynamic([...dynamicSites], uncertainPrefixes, eff);
  return { provenKeys: usage.resolvedKeys, uncertainPrefixes };
}
```

`eff` carries the effective **reference** policy, not the preserve policy — `policies.preserve.uncertainPrefixes` is never read here. The declared value *is* read elsewhere (`policies/preserve.ts:25` in `collectDeclaredSyncKeepPrefixes`, `:54` in `expandSchemaPathsForPreserve`, `:71-72` in `isDeclaredUncertainPath`), so it reaches **sync**'s hydrate/prune path but never reaches `cleanup`'s keep list.

`cleanup/candidates.ts` applies exactly two filters — `isPreservePath` (copy keys + copy prefixes) and `pathUnderAnyUncertainPrefix` (the scan-derived list above). There is no third path for declared uncertain prefixes.

**Repro.** On a repo where dynamic keys are reached only by template interpolation, so the scan *does* produce uncertain prefixes for them:

```ts
// i18nprune.config.ts
export default defineConfig({
  locales: { source: 'en', directory: 'locales', mode: 'locale_directory', structure: 'locale_per_dir' },
  src: 'src',
  functions: ['t'],
  policies: {
    preserve: {
      uncertainPrefixes: ['studio.role', 'studio.sectionKinds', 'studio.calloutTypes'],
    },
  },
});
```

```ts
// src/*.tsx
t(`studio.role.${role}`);         // → uncertain prefix studio.role
t(`studio.sectionKinds.${kind}`); // → uncertain prefix studio.sectionKinds
```

```bash
i18nprune cleanup --dry-run   # declared prefixes present, yet:
i18nprune cleanup --target so --dry-run
```

**Evidence.** Measured on the consumer repo (`so` locale, 991 key paths):

| `policies.preserve` | `cleanup --dry-run` | `cleanup --target so --dry-run` |
|---|---|---|
| `copyPrefixes` (11 roots) | 0 candidates | 0 candidates |
| `uncertainPrefixes` (11 roots) | **27 candidates** | **42 candidates** |

Declaring the prefixes under `uncertainPrefixes` left **more** candidates than the correct knob, i.e. it protected nothing. The 27 source-side candidates were exactly the live dynamic families (`studio.nav*` → `navDashboard`/`navTags`/…, `studio.dash*`, `studio.unsaved*`, `studio.aiAgentPrefs.*`, `studio.flag*`, `tools.*Info*`).

**Impact.** A consumer following `docs/config/policies.md` verbatim ("prefer declaring `uncertainPrefixes`") configures protection that does not exist for `cleanup`, then runs `cleanup --yes` and deletes live keys. The docs actively point away from the working knob.

**Fix sketch.** Either:

1. **Wire it (preferred).** Thread `policies.preserve` into `buildKeyReferenceContextFromLiteralUsageAndDynamicSites` and merge declared `uncertainPrefixes` into the returned list — `policies/preserve.ts` already has the normalising helper (`collectDeclaredSyncKeepPrefixes`, `normalizeSyncKeepPrefix`) and cleanup would then honour it in both modes for free.
2. **Or correct the docs** — move `uncertainPrefixes` out of the Cleanup column and add an explicit "cleanup ignores declared `uncertainPrefixes`; use `copyPrefixes`" note. Cheaper, but leaves a documented-API asymmetry and does not fix `--target`.

Option 1 also unblocks the semantic split: `uncertainPrefixes` is *shape* (translatable), `copyPrefixes` is *verbatim* (never machine-translated). Consumers with already-translated dynamic families currently have to use the verbatim knob to get cleanup protection.

**Regression test.** Parity/fixture test: a config declaring `uncertainPrefixes` must produce **0** cleanup candidates for keys under that root, and the count must match the `copyPrefixes` result for the same roots under both `cleanup` and `cleanup --target`.

---

## BUG-002

### `cleanup --target <locale>` drops all scan-derived uncertain-prefix protection

| | |
|---|---|
| **Severity** | **high** — silent data loss on a normal, documented flag |
| **Status** | open |
| **Area** | `cleanup` · `--target` |
| **Found** | 2026-10-12 |
| **Verified against** | v1.0.2 and v1.1.0 (identical; `run.ts:519` unchanged between tags) |
| **Code** | `packages/core/src/cleanup/run.ts:519` (and the `:300-320` branch it belongs to) |
| **Related** | BUG-001 (same subsystem, different mechanism) |

**Expected.** `cleanup` and `cleanup --target <locale>` should agree on which keys are *protected from removal*. A key reached by `t(\`studio.role.${role}\`)` is uncertain in both scopes — the target-locale JSON holds the same dynamic families. `--target` only changes *which locale file* is read, not the strength of the guard.

**Actual.** Target mode runs a **different candidate path** that never consults the uncertain list:

```ts
// packages/core/src/cleanup/run.ts:300-306
const leaves = isTargetMode ? readLocaleLeavesForCode(ctx, localeCode) : readCleanupSourceLeaves(ctx);
const allKeyPaths = new Set(leaves.map((leaf) => leaf.path));

if (isTargetMode) {
  const extra = computeExtraTargetKeys(ctx, analysis, localeCode);
  candidates = extra.candidates;      // ← no uncertain filtering
} else {
  const filterUncertain = eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const computed = computeCleanupCandidateKeys({
    leaves,
    usage: analysis.usage,
    preserve: ctx.config.policies?.preserve,
    uncertainPrefixes: refCtx.uncertainPrefixes,
    filterUncertainPrefixes: filterUncertain,
  });
  // …
}
```

and the report payload confirms the intent to drop it:

```ts
// packages/core/src/cleanup/run.ts:519
uncertainPrefixes: isTargetMode ? [] : refCtx.uncertainPrefixes,
```

`computeExtraTargetKeys` does honour `isPreservePath` (`suggestions/computeExtraTargetKeys.ts:43`), which is exactly why `copyPrefixes` protects target mode while `uncertainPrefixes` and scan-derived uncertainty do not. The `excludedUncertain` message is also gated on source mode (`run.ts:321`), so the operator gets **no signal** that protection was skipped.

**Repro.** Bare config — **no `policies` block at all**, so nothing is preserved by configuration:

```ts
export default defineConfig({
  locales: { source: 'en', directory: 'locales', mode: 'locale_directory', structure: 'locale_per_dir' },
  src: 'src',
  functions: ['t'],
});
```

```ts
// src/*.tsx — template holes produce uncertain prefixes via the scan
t(`studio.role.${role}`);
t(`studio.sectionKinds.${kind}`);
t(`studio.calloutTypes.${c}`);
t(`studio.localeMode.${mode}`);
```

```bash
i18nprune cleanup --dry-run --json                 # uncertain guard applies
i18nprune cleanup --target so --dry-run --json     # guard vanishes
```

**Evidence.** Same scan, same config, same 991-key target locale:

- `cleanup --dry-run --json` → **no** `studio.role.*`, `studio.sectionKinds.*`, `studio.calloutTypes.*`, `studio.localeMode.*` in the candidate list (all protected by the scan-derived uncertain prefixes).
- `cleanup --target so --dry-run --json` → all of them proposed for removal:

```text
studio.localeMode.en
studio.localeMode.so
studio.role.reader
studio.role.editor
studio.role.admin
studio.role.reviewer
studio.role.superadmin
studio.sectionKinds.prose
studio.sectionKinds.steps
studio.sectionKinds.faq
… (calloutTypes.* follows)
```

In the consumer repo these `so` values are **real translations**, not stubs:

```text
studio.role.*          → 4 of 5 differ from en   (e.g. 'Tifaftire')
studio.sectionKinds.*  → 2 of 5 differ from en
studio.calloutTypes.*  → 4 of 4 differ from en
studio.localeMode.*    → 2 of 2 differ from en
studio.permissionGroups.* → 4 of 5 differ from en
```

**Impact.** `i18nprune cleanup --target <locale> --yes` deletes live translated keys and their non-English content, with no warning and a clean `ok` exit. It hits `sync`-adjacent workflows too, since prune-after-sync is the natural way a translator drops keys. It is silent by construction: the guard that would have caught it is not merely disabled but absent from the code path.

**Fix sketch.** Make target mode use the same filtering as source mode — pass `refCtx.uncertainPrefixes` through `computeExtraTargetKeys` (or post-filter `extra.candidates` with `pathUnderAnyUncertainPrefix` when `uncertainKeyPolicy` is `protect`/`warn_only`), and emit `excludedUncertain` in target mode instead of gating that message on `!isTargetMode`. If dropping protection in target mode is deliberate, it needs a documented flag and a default-off, not a hardcoded `[]`.

**Regression test.** `cleanup --target <locale>` parity test: for a fixture whose dynamic families come only from template interpolation, the target candidate set must contain **no** path under an uncertain prefix, and the removal count must equal the source-mode result. Assert the `excludedUncertain` message fires in both modes.

**Note for consumers (interim).** Until fixed, use `policies.preserve.copyPrefixes` — it is the only knob honoured in both modes. See the consumer note in `VitaCaafimaad` `maintainer/systems/i18n.md`.

---

## BUG-003

### `kits identical` resolves source paths without the locale segment under `locale_per_dir`

| | |
|---|---|
| **Severity** | high — command cannot run at all in this layout; no output |
| **Status** | open |
| **Area** | `kits identical` · locale layout resolution |
| **Found** | 2026-10-12 |
| **Verified against** | v1.0.2 and v1.1.0 |
| **Code** | source-path resolution for `kits identical` (TBD — see fix sketch) |
| **Contrast** | `kits honest` reads the same signal and succeeds |

**Expected.** `kits identical` lists source-identical leaf paths per locale. Under `locales: { mode: 'locale_directory', structure: 'locale_per_dir' }`, source segments live at `locales/en/<segment>.json`. The command should resolve `locales/en/about.json`.

**Actual.** It resolves `locales/about.json` — the `en` segment is missing — and aborts:

```json
{
  "ok": false,
  "kind": "kits-identical",
  "data": { "sourceLocale": "en", "sourcePath": "", "totalSourceIdentical": 0, "locales": [] },
  "issues": [{
    "severity": "error",
    "code": "i18nprune.io.read_failed",
    "message": "ENOENT: no such file or directory, open '/…/apps/web/locales/about.json'",
    "path": "/…/apps/web/locales/about.json",
    "docPath": "docs/issues/io"
  }]
}
```

`sourcePath` is the empty string and no locale rows are produced, so the failure is a hard stop rather than a partial report.

**Repro.** Under `locale_directory` + `locale_per_dir` with locale-segment subfolders:

```bash
i18nprune kits identical          # ok: false — ENOENT … /locales/about.json
i18nprune kits identical -t so    # same failure
i18nprune kits identical --json   # same failure, code i18nprune.io.read_failed
i18nprune kits honest             # ok: true  — Source-identical leaves: 42
```

**Evidence.** Same repo, same config, same run:

| Command | Result |
|---|---|
| `kits honest` | `ok: true` · `Source-identical leaves: 42` |
| `kits identical` | `ok: false` · `i18nprune.io.read_failed` on `locales/about.json` |
| `kits identical -t so` | same failure |
| `kits identical --json` | same failure |

`kits honest` composes validate + dynamic + quality + review and reports the identical count successfully, so the underlying data is available and the layout is understood by the rest of the toolkit. The defect is localised to `kits identical`'s own path resolution.

**Impact.** A whole read-only audit surface is unavailable on locale-directory layouts — which is the layout `init --rich` and the docs recommend as keys grow. `kits honest` still works, so the gap is easy to miss until someone reaches specifically for `identical` (e.g. to review untranslated-looking leaves before a translation pass).

**Fix sketch.** Locate the source-path construction for `kits identical` and route it through the same segment resolver the rest of core uses (`segmentsForLocaleCode` / `targetLocaleCodesFromContext` from `shared/locales/targets`, or `resolveSourceLocaleAbsolutePath` from the config layer) instead of joining `locales.directory` + segment filename directly. `kits honest` already gets this right, so its call path is the reference implementation.

**Regression test.** Layout matrix test for `kits identical` across `flat_file`, `locale_directory` + `locale_per_dir`, and `locale_directory` + `feature_bundle`: each must produce `ok: true` and a non-zero `totalSourceIdentical` for a fixture with a known identical leaf. Add the same matrix guard for every `kits` subcommand that resolves source paths.

---

## Candidates — not yet verified as bugs

Not defects until reproduced. Keep separate from the register above so it stays trustworthy.

| Observation | Why it may not be a bug |
|---|---|
| `kits identical` reports nothing usable for `flat_file` either (untested) | Only `locale_per_dir` was exercised; `flat_file` may be fine and the entry should then be dropped rather than filed |
| `locales dynamic` count unchanged (28) after the v1.1.0 extractor HOC §A work | Expected for **data-object** keys (`t(item.labelKey)`), which have no const map or hook to fold. Confirm on a hook/alias codebase before treating as a regression |
| `policies.preserve.copyPrefixes` is *verbatim* (skip MT) while our dynamic families are translated | Not wrong today (`sync --dry-run` reports 0 leaves filled from source), but it is the wrong flavour semantically. Resolved by fixing BUG-001 and switching knobs — not a separate bug |
