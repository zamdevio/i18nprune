# Config command — layout-aware output

**Status:** **planned** — CLI UX slice; orthogonal to extractor / preserve-sync.  
**Tracker:** [`focus.md`](./focus.md) · **Receipts:** [`shipped/README.md`](../shipped/README.md) (when shipped).

**Goal:** `i18nprune config` human + `--json` output must describe **locale layout + all source segments**, not a single primary-segment path labeled as if it were the whole source tree.

---

## Already layout-aware (do not redo)

| Surface | Notes |
|---------|--------|
| `cleanup` / `missing` target labels | `formatLocaleSegmentFilesLabel` |
| `sync` human emit | Per-file / per-target via core |
| `locales list` | `segmentCount` + paths |
| `generate` JSON write plan | `segmentPaths` / layout |
| `cache --debug-cache` | Logs `localesLayout` in index |
| Core `review` / `quality` | Layout buckets already |

---

## Remaining

| # | Slice | Outcome |
|---|-------|---------|
| **C0** | **`config` human + JSON** | Mode / structure / source code; source as `en · N segment files: …`; optional `primarySegment` footnote; additive `--json` (`localesLayout`, `sourceLocaleSegments`, `localeSummary`). Keep `resolvedPaths.sourceLocale` = primary segment. |
| **C1** | **`init` post-write guidance** | Multi-segment-safe one-liner (not “create one `sourceRel` file”). |
| **C2** | **`doctor` leaf / paths detail** | `sourceLeaves` + missing-path copy cover all segments. |
| **C3** | **`report` / `share` metadata** | Text footer + payload don’t imply flat_file-only. |
| **C4** | **Validate banner + docs copy** | Singular “locale JSON” polish; `docs/commands/config.md` when C0 ships. |

**Non-goals (C0):** change path resolution; rewrite validate engine; doctor functional beyond leaf/path accuracy.

**Vocabulary:** source locale **code** · **primary segment** · **segment file** · **localesDir** — never label primary path as “the source locale” without segment count in multi-file modes.

**Fixtures:** `tests/fixtures/sample-i18n` (flat) · `tests/fixtures/stacks/nextjs` (feature_bundle, 5 en segments).

---

## Related

- Layout types: `packages/core/src/types/locales/layout.ts`
- Segment listing: `packages/core/src/shared/locales/enumerate/listLocaleSegments.ts`
- CLI helper: `packages/cli/src/shared/locales/segmentLabel.ts`
