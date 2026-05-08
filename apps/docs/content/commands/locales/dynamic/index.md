# `locales dynamic`

**Full examples:** [locales examples](../../../examples/commands/locales)

Read-only: scans **`srcRoot`** for **non-literal** translation call sites (heuristic), using the same pipeline as **`validate`**. It does **not** read or write locale JSON files. The scan is **project-wide**; it is keyed off the configured **source locale** in context (not a per-locale `--target` list).

```bash
i18nprune locales dynamic
i18nprune locales dynamic --top 20
i18nprune locales dynamic --full
i18nprune locales dynamic --json
i18nprune locales dynamic --json --top 50
i18nprune locales dynamic --json --full
```

| Flag | Meaning |
|------|---------|
| **`--top <n>`** | Max rows in **`sites[]`** (human output and **`--json`**; default **10** unless **`--full`**). |
| **`--full`** | Include **every** site in **`sites[]`** (human and **`--json`**; overrides **`--top`**). |

## JSON mode

With global **`--json`**, stdout is one **`CliJsonEnvelope`** (`kind`: **`locales-dynamic`**). **`data.dynamic`** has **`count`** (total matched sites) and **`sites[]`** (capped by **`--top`** / **`--full`** — same rules as human output). **`data`** also includes **`sourceLocalePath`**, **`sourceLocaleCode`**, **`top`**, **`full`**, and **`shown`** (`sites.length` for this emission).

The root CLI also declares **`--top`** / **`--full`** (shared flags). Typical invocations **`i18nprune --json locales dynamic --top N`** / **`… --full`** resolve the same as placing those flags immediately after **`dynamic`**.

For **missing literal keys** and the same dynamic **count** in one envelope, use **`i18nprune validate --json`**.

## See also

- [`locales`](..)
- [`validate`](../../validate)
- [Dynamic keys](../../../barriers/dynamic-keys.md)
