# Performance & large-repo validation

This section documents **how i18nprune behaves at scale**: scan breadth, wall-clock time for representative commands, and how to interpret counts when the scan root is very large.

## What “performance” means here

| Axis | Meaning |
|------|--------|
| **Scan scale** | Number of source-like files under `src` (see [config `src`](../config)) that participate in key-site and dynamic scans. |
| **Wall time** | Elapsed seconds for a full CLI run on a given machine (CPU, disk, Node version). Prefer **GNU** `/usr/bin/time -v` for comparable CPU and **max RSS** (see [Next.js case study](./nextjs.md#how-to-measure-wall-clock-and-memory)); Fish’s builtin `time` is not the same tool. |
| **Correctness** | Paths and spans in reports match files on disk; extraction rules are documented under [regex](../regex) and [dynamic keys](../dynamic). |

## What is measured

- **File count** — files matching scanable extensions under the resolved `src` root (same pipeline as [`validate`](../commands/validate) / [`report`](../commands/report)).
- **Command duration and peak memory** — GNU `/usr/bin/time` (`-v` or `-f`; see [Next.js case study](./nextjs.md#how-to-measure-wall-clock-and-memory)).
- **Extractor outputs** — counts of literal observations, dynamic sites, and missing keys relative to the source locale JSON (semantics in [JSON output](../json) and command docs).

## Reproducibility

- Steps in each case study are **copy-pasteable**: clone, config, commands.
- Numbers are from **real repositories**, not synthetic trees, unless explicitly labeled otherwise.
- Timings **vary by hardware, Node major, stdout handling, thermal state, and cold vs warm CLI cache**; treat published seconds as **order-of-magnitude**, not SLA.
- **`--config` / `-c`** — run from **any** cwd by passing **`-c /absolute/path/to/i18nprune.config.ts`**; paths in config resolve relative to the config file’s directory (see case studies).
- **i18nprune Web Runtime (workspace tree)** — **re-upload** project zips (or re-parse locally) after tree/builder changes so **remote** snapshots pick up the latest **`buildProjectTreeFromPaths`** behavior (empty dirs from zip `/` entries, phantom folder-file dedupe).

## Exclude: shrink what gets scanned

Broad `src` (for example repo root `.`) walks **everything** matching scan extensions — compiled bundles, tests, benches — so file counts and **dynamic-site noise** spike even when correctness is fine.

**Levers:**

- Config **`exclude`**: **`preset`**, **`patterns`** (regex list), **`dirs`**, **`extensions`**, **`useDefaultSkip`**, **`files`**. Full semantics and precedence vs the CLI: **[Exclude](../config/exclude.md)**.
- Global **`--exclude`** — comma-separated directory **basenames** merged into the skip list ([CLI overview](../cli)).

Skipping large trees routinely cuts **wall time** and often **peak RSS** by a large factor; case studies benchmark **cold** paths with **`--no-cache`** so numbers are comparable run-to-run ([Next.js](./nextjs.md)).

## CLI project cache

By default i18nprune reuses fingerprints and cached report payloads under **`~/.i18nprune/cache/`**. Global **`--no-cache`** disables that reuse for the invocation — essential when you want **cold** timings after config edits.

Detailed layout, eviction, and distinction from **`~/.config/i18nprune/updatestate.json`** (npm **latest** throttle): **[CLI cache](../cli/cache.md)**.

Warm runs can look **dramatically faster** than cold ones on huge trees; always say whether a number used **`--no-cache`**.

## When to refresh benchmark pages

Treat **tables and extraction counts as snapshots**. Re-run measurements and bump the methodology block (date, **`i18nprune`** semver, Node major) whenever any of these change materially:

- Scanner / **`exclude`** / cache pipeline in **`@i18nprune/core`** or the CLI.
- Default CLI cache behavior or **`--no-cache`** semantics.
- The **upstream** repo revision (e.g. new **next.js** shallow clone) so file counts stay believable.

If you only change docs prose, you do **not** need new numbers — but keep claims aligned with the methodology already printed on [Next.js](./nextjs.md) and [CepatEdge](./cepatedge.md).

## Case studies & product workflows

| Document | Repo | Role |
|----------|------|------|
| [Next.js (shallow clone)](./nextjs.md) | [vercel/next.js](https://github.com/vercel/next.js) | Large mixed TS/JS repo; timings, **`/usr/bin/time`**, **exclude + cache** workflow. |
| [CepatEdge — CLI workflow](./cepatedge.md) | [CepatEdge](https://github.com/zamdevio/cepatedge) (planned / linked from [Origin](../origin#open-source-plan-for-cepatedge)) | **Which** commands to run, **when** to time runs, tiered checklist (3 / 5 / 8 commands). |
