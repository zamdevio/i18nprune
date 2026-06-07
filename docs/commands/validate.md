# `validate`

Ensures **string literal keys** used in translation calls exist in the **source locale JSON**. Calls whose first argument is **not** a static string are reported as **dynamic** (same heuristic model as **`sync`** warnings).

**Literal key set:** built from **per-file** key-site scanning so `` `${NS}.segment` `` uses each file’s own `const` map (duplicate `NS` in different files does not collide). See [Duplicate const identifiers](../architecture/extraction/regex.md).

**Limits:** extraction is heuristic, not full TypeScript semantic analysis. Hook destructuring (for example `const { t } = useTranslation()`) is not resolved yet — configure explicit `functions` entries or see the [unsolved inventory](../edge-cases/unsolved/inventory.md). See [Regex and static-analysis limits](../architecture/extraction/regex.md) and [Extraction architecture](../architecture/extraction/README.md).

```bash
i18nprune validate
i18nprune validate --json
```

Uses config **`functions`**, **`src`**, and resolved **source** path. See [CLI overview](../cli/README.md) and [verbosity](../cli/verbosity.md).

**`validate --json`:** **`data.count`** matches **`data.keyObservations.count`** (literal observation total). **`data.missing`** lists keys in code missing from the source locale JSON — use **`missing.length`** for that total, not **`data.count`**. **`data.dynamic.count`** counts non-literal call sites; **`issues[]`** may include warnings. Per-call-site literals and **`sites[]`**: **`i18nprune report --format json`** / HTML report **`details`**; dynamic file:lines: **`i18nprune locales dynamic`** (**`--json`** with **`--top`** / **`--full`** when needed).

## Examples

```bash
i18nprune validate
i18nprune validate --json | jq '{ok, missing: (.data.missing|length), dynamic: .data.dynamic.count}'
```

```bash
# CI gate
i18nprune validate --json | jq -e '.ok'
```

```bash
# Show missing keys and observation totals explicitly
i18nprune validate --json \
  | jq '{missing: .data.missing, missingCount: (.data.missing|length), keyObservations: .data.keyObservations.count, dynamic: .data.dynamic.count}'
```

For reusable filters across commands, see the [jq cookbook](../examples/jq-cookbook.md).
