# Exclude (scan scope)

`exclude` controls what the source scanner skips before extraction. It is part of core config shape, so it applies consistently across CLI commands and other clients that pass config to core.

## Why use it

- Narrow scan scope to product code.
- Drop generated/vendor/test-heavy trees.
- Reduce dynamic-site noise and improve runtime performance.

## Config shape

```ts
import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: '.',
  functions: ['t'],
  exclude: {
    preset: 'production',
    dirs: ['fixtures'],
    files: [/\.gen\./],
    extensions: ['d.ts'],
    patterns: [/^src\/generated\//],
    useDefaultSkip: true,
  },
} satisfies Partial<I18nPruneConfig>);
```

## Precedence (merge order)

When the scanner runs, rules are built in this order:

1. **Built-in directory skip list** — applied when `useDefaultSkip !== false` (e.g. `node_modules`, `dist`, `build`, `.git`, …). Turn off with `useDefaultSkip: false` in config.
2. **`exclude.preset`** — expands to that preset’s `dirs`, `files`, `extensions`, and `patterns` (see below).
3. **Config file** — your explicit `dirs`, `files`, `extensions`, and `patterns` are **appended after** the preset lists for each field (preset first, then config).
4. **CLI globals** — `--exclude a,b` appends directory basenames to `exclude.dirs` **after** the config file’s lists (deduped).

So: **CLI overrides** apply to default-skip and extra dirs; **config** extends preset lists; **preset** is the curated baseline.

## Debug scan (global)

The scanner emits structured **`ScanDebugEvent`** objects (`skip_directory` | `skip_file` with `relativePath`, `basename`, `reason`). **Core never writes to `console`** — it only calls an optional listener so the package stays runtime-agnostic.

- **CLI:** **`--debug-scan`** registers `RunOptions.onScanDebug` for the process; the CLI prints each event with the normal logger prefix as **`[i18nprune] [scan] skip dir|file …`** (same channel as `[warn]`). Suppressed when **`--silent`** or **`--json`** is set.
- **API:** set **`onScanDebug`** on **`RunOptions`** (via `setRunOptions`) and/or pass **`onScanDebug`** as the **fourth argument** to **`listSourceFiles`** (per-call listener wins over the global one). Same field exists on **`scanProjectSourceFiles`** input as **`scanDebug`**.

Use this to tune `exclude.patterns`, `dirs`, and `--exclude` without guessing which rule fired, or to pipe events into your own logger, UI, or tests.

Commands that combine **literal key extraction** + **dynamic call-site scanning** can still walk **`src/`** more than once in a single run (for example **`buildProjectReportDocument`** intentionally runs **`scanProjectKeyObservations`** and **`scanProjectDynamicKeySites`** as separate passes — they answer different questions). **`i18nprune sync`** reuses **one** cached project-report build for both its reference context and **`dynamicSites`**, so you should not see the *same* file skip line repeated separately for **`buildKeyReferenceContext`** *and again* for **`resolveLocalesDynamicSites`** anymore.

## Preset

Currently available:

- `production`

### `production` preset contents

Built-in defaults (merged before your explicit lists):

- `dirs`: `node_modules`, `dist`, `build`, `compiled`, `tests`, `bench`
- `files`: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`
- `extensions`: `test.ts`, `test.tsx`, `spec.ts`, `spec.tsx`, `test.js`, `test.jsx`, `spec.js`, `spec.jsx` — these match **basename suffixes** (e.g. `foo.test.ts` matches the `test.ts` token), similar in intent to glob patterns like `*.test.*` / `*.spec.*`.

`i18nprune init` writes **`preset: 'production'`** in the starter config so new projects adopt this baseline in one line.

## CLI merge behavior

Global `--exclude <list>` appends directory basenames to `exclude.dirs` from config.

- Config + CLI are combined before context is passed to core.
- Duplicates are removed in order for string rules.
- Use `exclude.useDefaultSkip: false` in config to disable built-in skips.

Examples:

```bash
i18nprune validate --exclude bench,compiled
i18nprune report --exclude tests
```

## Performance

Narrowing the scan (especially **`src`**, **`preset: 'production'`**, and extra `dirs` / `patterns`) reduces file counts and wall time. Published measurements and methodology:

- [Performance overview](../performance/README.md)
- [Next.js-scale example](../performance/nextjs.md) (real checkout, Node version, command timings)
- [CepatEdge `apps/web` example](../performance/cepatedge.md)

## Guidance

- Prefer `preset: 'production'` as baseline, then add project-specific rules.
- Keep `patterns` focused and anchored where possible.
- If results look noisy, first tighten `src`, then refine `exclude`.
