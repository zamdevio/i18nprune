# Key sites vs dynamic detection

[← Back to regex overview](.)

Two complementary pipelines:

## Key sites (`scanProjectKeyObservations`)

Per source file:

1. Build a **const string map** from top-level-ish `const X = '...'` patterns (`buildConstStringMap`).
2. **Comment ranges** — line and block comments (`commentRangesForJsLikeText`); translation calls whose **start** falls inside a range are **skipped** (not treated as runtime key usage).
3. **Observations**:
   - **`literal`** — first arg is a single quoted string.
   - **`template_resolved`** — after `&#36;{ident}` substitution from the const map, the template is a full static dotted key.
   - **`template_partial`** — still has unresolved placeholders; may set **`uncertainPrefix`** (longest static path segment before the first unknown `&#36;{…}`) for **prefix-based protection** in `reference` policy.

Code: `packages/cli/src/core/extractor/keySites/scan.ts`, `orchestrate.ts`.

## Dynamic sites (`scanProjectDynamicKeySites`)

Per file extension, providers run (e.g. JavaScript-like: `providers/javascript.ts`):

- Non-literal first args, empty calls, template interpolation where the full key cannot be rebuilt from the const map.
- May attach **`resolvedPrefix`** for partial static segments.
- **Comment** offsets flip **`kind`** to `commented` / **`isCommented`** when `treatCommentedCallSitesAsRuntime` is false in **`reference`** — those sites do not contribute uncertain prefixes.

## Unified context

`buildKeyReferenceContext` ( `packages/cli/src/core/reference/context.ts` ) merges:

- **Proven keys** — `resolvedKeysFromObservations` (literal + template_resolved only).
- **Uncertain prefixes** — from `template_partial.uncertainPrefix` and dynamic `resolvedPrefix`, filtered by **`reference`** toggles.

## Merged source text

Some helpers use **one concatenated blob** (e.g. tests or older merged-text call paths). In those modes **per-file** metadata is missing: **comment suppression** and **file paths** may be omitted. Prefer **per-file** `scanProjectKeyObservations` / `scanProjectDynamicKeySites` for accurate locations. See [Per-file const maps](../edge-cases/solved/per-file-const-map.md).

## Accuracy

There is **no single global percentage**: results depend on coding style, framework, and how much logic is indirect. Defaults in **`reference`** prefer **safe** behavior (protect under uncertain prefixes) over aggressive cleanup.

See also [Detection limits](.#detection-limits) in the overview.
