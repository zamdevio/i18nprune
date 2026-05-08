# `locales dynamic`

**Full examples:** [locales examples](../../../examples/commands/locales)

Read-only: scans **`srcRoot`** for **non-literal** translation call sites (heuristic), using the same pipeline as **`validate`**. It does **not** read or write locale JSON files. The scan is **project-wide**; it is keyed off the configured **source locale** in context (not a per-locale `--target` list).

```bash
i18nprune locales dynamic
i18nprune locales dynamic --top 20
i18nprune locales dynamic --full
i18nprune locales dynamic --json
```

| Flag | Meaning |
|------|---------|
| **`--top <n>`** | **Human output only:** max lines of sites to print (default **10**). Ignored when global **`--json`** is active. |
| **`--full`** | **Human output only:** print every site. Ignored with **`--json`**. |

## JSON mode

With global **`--json`**, stdout is one **`CliJsonEnvelope`** (`kind`: **`locales-dynamic`**) whose **`data.dynamic`** matches the **`validate`** shape: **`count`** and full **`sites[]`** (`DynamicKeySite`). **`data`** also includes **`sourceLocalePath`**, **`sourceLocaleCode`**, and display metadata (**`top`**, **`full`**, **`shown`**) for human-mode parity; **`--top` / `--full` do not cap or alter the JSON site list**.

For the same scan with literal-key **`missing`**, use **`i18nprune validate --json`**.

## See also

- [`locales`](..)
- [`validate`](../../validate)
- [Dynamic keys](../../../barriers/dynamic-keys.md)
