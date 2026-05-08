# Next.js — large-repo validation

This page records a **manual, reproducible** run of the i18nprune CLI against [vercel/next.js](https://github.com/vercel/next.js): repo-wide `src: '.'`, representative commands, **`/usr/bin/time`** samples, **`--no-cache`** vs warm cache, and **`--exclude`** + **`exclude.patterns`** effects. Repeat on **your** machine — **seconds differ** across Node versions, CPUs, disks, shells, TTY formatting, and whether CLI **stdout is discarded** during timing.

## Why this repository

- **Size and diversity** — tens of thousands of TS/JS-like files, JSX, nested calls, and mixed authoring styles.
- **Real maintenance path** — widely used open-source tree; results are inspectable in GitHub or a local checkout.
- **Stress on scan scope** — a single `.` root includes compiled bundles and tooling areas that are **correctly scanned** but often **not** what you want for product-only i18n metrics.

## Setup

```bash
git clone --depth=1 https://github.com/vercel/next.js.git
cd next.js
```

Install **`i18nprune`** from npm (or **`pnpm link`**) so `i18nprune` is on **`PATH`**.

## Configuration

Scaffold the default config at the repo root:

```bash
i18nprune init
```

That produces **`i18nprune.config.ts`** using **`defineConfig`** / **`I18nPruneConfig`** from **`i18nprune/config`** (see [Configuration](../config)). Tune **`source`**, **`localesDir`**, **`src`**, **`functions`**, **`exclude`** for your tree.

The **documented benchmark** assumes a root config aligned with **`src: '.'`**, **`useDefaultSkip: true`**, and **commented** `exclude.patterns` stubs (`packages/*/compiled`, Turbopack test/bench paths, `test/`, …) — the same shapes people enable when cutting scan noise ([full exclude reference](../config/exclude.md)).

## Exclude (`--exclude` + `exclude.*`)

Tune **one** subsystem instead of scattering flags across sections:

| Mechanism | Role |
|-----------|------|
| **`exclude.preset`**, **`exclude.patterns`**, **`dirs`**, **`extensions`**, **`useDefaultSkip`**, **`files`** | Persistent skips in **`i18nprune.config.ts`** ([Exclude](../config/exclude.md)). |
| **`--exclude tests,bench`** (comma-separated **directory basenames**) | Extra skips for **this** invocation ([precedence](../config/exclude.md), [CLI overview](../cli)). |

**Impact:** skipping tests, benches, compiled bundles, and generated trees routinely drops scanned file counts and often **cuts wall time and RSS** by a multiple compared to scanning the whole checkout ([Performance hub](.#exclude-shrink-what-gets-scanned)).

**A/B benchmarking (cold, comparable):**

```bash
export CONFIG="$HOME/next.js/i18nprune.config.ts"

# Cold — no CLI project cache either way (see CLI cache doc)
/usr/bin/time -f '%E wall · %U usr · %S sys · %M KB max RSS' \
  i18nprune validate --no-cache -c "$CONFIG"
/usr/bin/time -f '%E wall · %U usr · %S sys · %M KB max RSS' \
  i18nprune validate --no-cache --exclude tests,bench -c "$CONFIG"
```

Then **uncomment** the repo’s example **`patterns[]`** blocks (compiled paths, Turbopack tests/benches, `test/` heuristics) and rerun the same **`/usr/bin/time`** lines **`--no-cache`** — that shows the incremental win from regex-based exclusions on top of (or beside) **`--exclude`**.

> **Variance:** Tables below used **Node 20**, **CLI stdout redirected to `/dev/null`**, **single samples** — different from an **interactive** run with warnings printed to TTY (**~7–8 s** reported for **`validate --no-cache --exclude tests,bench`** on another workstation with **`patterns`** still commented). Treat all numbers as **ballpark**.

## CLI project cache

Default cache **`~/.i18nprune/cache/`**, **`--no-cache`**, clears vs **`updatestate.json`**: **[CLI cache](../cli/cache.md)**. Warm runs are often much faster than cold on trees this size (**[Performance hub](.#cli-project-cache)**).

## Running from another directory (`-c`)

You do **not** need **`cd`** into the clone. Point **`--config`** (**`-c`**) at the config file; **`source`**, **`localesDir`**, **`src`** resolve relative to the config directory.

```bash
export CONFIG="$HOME/next.js/i18nprune.config.ts"
cd ~

/usr/bin/time -f '%E wall · %U usr · %S sys · %M KB max RSS' i18nprune doctor -c "$CONFIG"
/usr/bin/time -f '%E wall · %U usr · %S sys · %M KB max RSS' i18nprune validate -c "$CONFIG"
```

On **Fish**, call **`/usr/bin/time`** explicitly (the builtin is not GNU `time`).

## Debug scan (`--debug-scan`)

Skip reasons print on stderr in the **`[scan]`** family:

```text
[i18nprune] [scan] skip file path/to/file.css: not a scanned source extension (file.css)
```

Useful when validating **[exclude](../config/exclude.md)** tuning.

## How to measure (wall clock and memory)

Use **GNU** `time` via **`/usr/bin/time`**:

```bash
/usr/bin/time -v i18nprune validate -c "$CONFIG"
/usr/bin/time -f '%E real · %U user · %S sys · %M KB' \
  i18nprune report -c "$CONFIG" --format json --out reports/project-report.json
```

**`%M`** is **max RSS in KB** (÷ **1024** for MiB). CPU user+sys time can exceed wall when work spans cores.

---

## Documented run (methodology)

| | |
|--|--|
| **When** | 2026-05-03 |
| **Host** | Linux (x86_64 workstation class) |
| **Node.js** | v20.18.2 |
| **i18nprune** | 0.1.0 (CLI **`--version`**) |
| **Invocation** | **`cd ~`**; **`-c /home/amf/next.js/i18nprune.config.ts`**. Rows below: CLI **stdout → `/dev/null`**, **`/usr/bin/time -f '%e %U %S %M'`**. |
| **Order** | Interleaved benchmarks; figures are **single samples** — repeat for confidence. |

---

## Extraction counts (report JSON)

From **`i18nprune report --format json --out …`** on **this** shallow **next.js** checkout at the time of the run (upstream `main` moves — re-run **`report --format json`** after a fresh clone if numbers look stale):

| Metric | Value |
|--------|------:|
| Source files scanned (`summary.sourceFilesScannedCount`) | **20,435** |
| Dynamic key sites (`summary.dynamicSitesCount`) | **3,062** |
| Missing literal keys (`summary.missingKeysCount`) | **109** |
| Key observations (`summary.keyObservationsCount`) | **133** |

---

## Time and memory (GNU `/usr/bin/time`)

Wall = **`%e`** elapsed; **Max RSS** from **`%M`** (**KB**).

### Warm CLI cache vs **`--no-cache`** (same config)

| Command | Condition | Wall | User | Sys | Max RSS (KB) | ≈ Max RSS |
|---------|-----------|------|------|-----|--------------|-----------|
| `i18nprune doctor -c …` | warm (default project cache) | 2.80 | 1.49 | 1.38 | 148,952 | ~145 MiB |
| `i18nprune doctor -c …` | **`--no-cache`** | 13.76 | 9.58 | 2.86 | 189,048 | ~185 MiB |
| `i18nprune validate -c …` | warm | 2.72 | 1.52 | 1.33 | 151,840 | ~148 MiB |
| `i18nprune validate -c …` | **`--no-cache`** | 14.02 | 9.63 | 3.16 | 190,840 | ~186 MiB |

### Cold samples (**`--no-cache`**, stdout discarded)

| Command | Wall | User | Sys | Max RSS (KB) | ≈ Max RSS |
|---------|------|------|-----|--------------|-----------|
| `i18nprune report -c … --format json --out reports/…` | 14.55 | 9.89 | 2.88 | 188,936 | ~184 MiB |
| `i18nprune sync -c … --dry-run` | 19.22 | 16.84 | 4.27 | 195,176 | ~191 MiB |

### Narrowing scan: **`validate --no-cache`** with **`--exclude`** (same host + methodology)

```bash
/usr/bin/time -f '%e %U %S %M' i18nprune validate --no-cache --exclude tests,bench -c "$CONFIG"
```

| Variant | Wall (s) | Max RSS (KB) |
|---------|----------|--------------|
| `validate --no-cache` (patterns still commented out in config) | **14.02** | 190,840 |
| `validate --no-cache --exclude tests,bench` | **8.27** | 180,160 |

Uncomment **`exclude.patterns`** in config for typically **another** large drop in scanned paths — measure with the same **`/usr/bin/time`** invocation.

---

## Example findings

### Literal-style calls

```js
t('title');
t('description');
```

### Multiline / rich second argument

```js
t('description', {
  locale,
  code: (children) => <Code>{children}</Code>,
});
```

### Dynamic-style patterns (high count with repo-wide `src`)

```js
t(...args);
t(u);
t(`&#36;{NS}.status.&#36;{x}`);
```

`validate` surfaces paths into compiled bundles — e.g. `packages/next/src/compiled/...`.

---

## Important notes (scan scope vs “noise”)

### Why dynamic-site count is high

- With **`src: '.'`**, every scanable file under the clone can be walked (subject **`exclude`** / defaults).
- **Compiled** and **bench** code legitimately contains `t()`-shaped calls that are **not** app-level i18n.
- Dynamic detection is **permissive by design** ([Dynamic keys](../dynamic)).

### What to do in practice

- Narrow **`src`**, **`exclude`**, and **`--exclude`** ([Performance hub](.#exclude-shrink-what-gets-scanned), [Exclude](../config/exclude.md)).

---

## Report UI

HTML output opens locally; links use IDE schemes where applicable ([Report UI](../report)).

## Conclusion

- Counts assume **`src: '.'`** (~**20k** files scanned) unless you tighten **[exclude](.#exclude-shrink-what-gets-scanned)**.
- Document **cold vs warm** (**`--no-cache`**) whenever you cite wall time (**[CLI cache](../cli/cache.md)**).
- Re-run **`/usr/bin/time`** after config changes; compare **Node major** and **stdout policy**.
