# `locales dynamic`

Read-only subcommand: scans **`srcRoot`** for **non-literal** translation calls (heuristic), using the same helpers as **`validate`**. It does **not** read or write locale JSON.

## Usage

```bash
i18nprune locales dynamic
i18nprune help locales dynamic
```

## Output

Lists each detected site with **`kind`**, **`functionName`**, and a short **`preview`** (single merged scan today — per-file line numbers land with the cross-cutting scanner upgrade).

For machine-readable dynamic data, use **`i18nprune validate --json`** (`dynamic` block).

## Roadmap

Cross-cutting work (see [Roadmap](../../roadmap/README.md)): comment stripping across languages, more source extensions, **`Commented`** vs used keys in summaries, and usage paths per key.

## See also

- [`locales`](../README.md)
- [`validate`](../validate/README.md)
