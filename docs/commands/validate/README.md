# `validate`

**Full examples:** [validate examples](../../examples/commands/validate/README.md)

Ensures **string literal keys** used in translation calls exist in the **source locale JSON**. Calls whose first argument is **not** a static string are reported as **dynamic** (heuristic scan via `packages/cli/src/core/extractor/dynamic/` — same rules as **`sync`** warnings).

**Literal key set:** built from **per-file** key-site scanning so `` `${NS}.segment` `` uses each file’s own `const` map (duplicate `NS` in different files does not collide). See [Duplicate const identifiers](../../regex/extraction.md#duplicate-const-identifiers-across-files).

**Limits:** extraction is regex/heuristic, not a full TypeScript semantic analysis. See [Detection limits](../../regex/README.md#detection-limits) and [translation call extraction](../../regex/extraction.md) (known gaps and indirection).

```bash
i18nprune validate
i18nprune validate --json
```

Uses config **`functions`**, **`src`**, and resolved **source** path. See [CLI overview](../../cli/README.md) and [verbosity](../../cli/verbosity/README.md).

**`validate --json`:** **`data.count`** matches **`data.keyObservations.count`** (literal observation total). **`data.missing`** lists keys in code missing from the source locale JSON — use **`missing.length`** for that total, not **`data.count`**. **`data.dynamic.count`** counts non-literal call sites; **`issues[]`** may include the usual warnings. Per-call-site literals and **`sites[]`**: **`i18nprune report --format json`** / HTML report **`details`**; dynamic file:lines: **`i18nprune locales dynamic`** (**`--json`** with **`--top`** / **`--full`** when needed).
