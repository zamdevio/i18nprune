# Key extraction

- **Literal + template observation**: `packages/cli/src/core/extractor/keySites/scan.ts` emits `KeyObservation[]` for:
  - `literal`
  - `template_resolved` (via const substitution)
  - `template_partial` (unresolved placeholders kept as structured data)
- **Const substitution trace**: `packages/cli/src/core/constmap/resolve.ts` exposes `resolveKeyPlaceholdersWithTrace()` so extraction can include ordered substitution steps.
- **Project orchestration**: `scanProjectKeyObservations()` walks `srcRoot`, adds `span.filePath`, and is suitable for CLI/report payloads.
- **Dynamic heuristic scan**: `packages/cli/src/core/extractor/dynamic/` detects non-literal first args and comment-aware sites for diagnostics (`validate`, `locales dynamic`).
- **Parsing strategy**: scanners parse exact translation call spans first, then evaluate only the first argument expression. This prevents preview bleed into neighboring code and supports multiline/comment-heavy calls.
- **Multiline signal**: observations/sites preserve whether a call is multiline (`isMultilineCall`) so JSON/report consumers can prioritize complex call sites.
- **Validation behavior**: `validate` compares resolved literal/template keys to source locale leaves; dynamic findings are reported separately.
