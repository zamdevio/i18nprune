# `validate`

Ensures **string literal keys** used in translation calls exist in the **source locale JSON**. Calls whose first argument is **not** a static string are reported as **dynamic** (heuristic scan via `src/core/dynamic/` — same rules as **`sync`** warnings).

```bash
i18nprune validate
i18nprune validate --json
```

Uses config **`functions`**, **`src`**, and resolved **source** path. See [CLI overview](../../cli/README.md) and [verbosity](../../cli/verbosity/README.md).
