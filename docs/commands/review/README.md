# `review`

**Full examples:** [review examples](../../examples/commands/review/README.md)

**Summary-only** locale audit vs the **source** JSON: how many string paths exist, how many still **match the source** (source-identical / parity hint), and—when leaves use **structured objects**—aggregates for **`needsReview`**, **confidence**, **status**, and **source**.

Deep key enumeration, code scans, and big reports stay on **`validate`**, **`quality`**, and **`report`**. **`review`** stays fast and stable for day-to-day “how are my locale files shaped?” checks.

```bash
i18nprune review
i18nprune review --target all
i18nprune review --target ja,ar
i18nprune review --target zh-cn
i18nprune --json review
```

## `--target` (scope)

| Value | Meaning |
|-------|---------|
| *(omit)* | Same as **`all`**: every **`*.json`** under **`localesDir`** except the source file. |
| **`all`** | Explicit “all non-source locales”. |
| **One code** | e.g. **`ja`** or **`ja.json`** — only that file. |
| **Comma list** | e.g. **`ja,ar,zh-cn`** — only those files. |

Unknown codes simply match nothing (empty result for that code).

## Human mode

Structured log lines: orange **`[i18nprune]`**, dim **`[review]`**, green **`[info]`** / yellow **`[warn]`**, **bold cyan** section titles, **gold** locale filenames, **gold** numeric tokens inside lines, dim tip text. Implemented in `packages/cli/src/core/review/humanLog.ts` and `commands/review/run.ts`.

Sections: **Context** (resolved paths, scope) and **Review** (per locale aggregates).

## `--json`

One **`CliJsonEnvelope`** with **`kind`: `review`** and **`data.kind`: `localeReview`**. Each locale entry includes **`stringPaths`**, **`englishIdentical`**, **`legacyLeaves`**, **`structuredLeaves`**, **`needsReviewTrue` / `needsReviewFalse` / `needsReviewUnset`**, **`byStatus`**, **`bySource`**, and **`confidenceBuckets`**.

## Structured leaves

Non-source files can mix **plain strings** (legacy) and objects shaped like:

`{ "value": "…", "status"?: "…", "confidence"?: number | null, "needsReview"?: boolean, "source"?: "…" }`

at terminal paths. Nested objects without a string **`value`** are traversed as usual.

### Why everything is still “legacy” after `sync` / `generate` / `fill`

Those commands follow the **source locale JSON shape**: leaves are **strings**, matching `mergeToTemplateShape` / `setAtPath` behavior in **`sync`** and the generate/fill pipelines. **`sync`** only merges and prunes to that shape — it does **not** upgrade plain strings into structured objects, so **`written: 0`** means the file already matched the template.

**`review`** still computes real **`needsReview` / confidence / by-status`** histograms, but only from **structured** leaves. For all-string files, **`byStatus: legacy`** is the honest aggregate (every string is counted as legacy for those dimensions). Human output skips the redundant confidence/status/source lines until **`structuredLeaves > 0`**.

A future **opt-in migration** (or generate/fill mode) to emit structured locale JSON would be a separate, explicitly versioned feature—watch **[Roadmap](../../roadmap/README.md)** / **[Patching](../../patching/README.md)** if it lands, not something `sync` does silently today.

## Related

- [JSON mode and long commands](../../behavior/json-long.md)
- [Validate](../validate/README.md) · [Quality](../quality/README.md) · [Report](../report/README.md)
