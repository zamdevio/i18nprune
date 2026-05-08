# CepatEdge — suggested i18nprune CLI workflow

**CepatEdge** is the maintenance platform this workflow targets: use the page as a **checklist**. The **timed** block below uses a real **`apps/web`** checkout and **`-c`** so you can run from **any** current working directory.

## Documented run — CepatEdge `apps/web`

| | |
|--|--|
| **When** | 2026-05-03 |
| **Host** | Linux (x86_64 workstation class) |
| **Node.js** | v20.18.2 |
| **i18nprune** | 0.1.0 |
| **Config path (this run)** | `/home/amf/Projects/CepatEdge/apps/web/i18nprune.config.ts` — set `CEPAT_WEB` (or similar) to **your** clone. |
| **Invocation** | **`cd ~`** (or anywhere); **`-c "$CEPAT_WEB"`**. Timings: **`/usr/bin/time -f '%e %U %S %M'`**, CLI stdout **`/dev/null`** (`%M` = max RSS **KB**). |

Resolved layout:

| | Path |
|--|------|
| Config | `<repo>/apps/web/i18nprune.config.ts` |
| Source locale | `<repo>/apps/web/locales/en.json` |
| Locales dir | `<repo>/apps/web/locales` |
| Scan root (`src`) | `<repo>/apps/web/src` |

### Extraction summary (`report --format json`)

Snapshot from **`report --format json`** on the **pinned** config path / product revision in the table above — your tree may differ; **[When to refresh benchmark pages](.#when-to-refresh-benchmark-pages)**.

| Metric | Value |
|--------|------:|
| Source files scanned | **269** |
| Key observations | **1,177** |
| Non-literal / dynamic sites | **88** |
| Missing literal keys | **0** |

Dynamic-site examples include navigation **`labelKey`**, SEO **`seo.routes.&#36;{routeId}`**, dashboard **`roles.display.*`**, legal **`&#36;{P}.*`** — product patterns vs minified-bundle noise in whole-repo clones ([Next.js case study](./nextjs.md)).

### Time and memory (`/usr/bin/time -f '%e %U %S %M'`, `--no-cache` unless noted)

| Command | Condition | Wall (s) | User | Sys | Max RSS (KB) | ≈ MiB |
|---------|-----------|-----------|------|-----|--------------|-------|
| `doctor -c …` | `--no-cache` | 1.44 | 1.02 | 0.45 | 98,288 | ~96 |
| `validate -c …` | `--no-cache` | 1.39 | 0.98 | 0.50 | 96,512 | ~94 |
| `validate -c …` | warm | 1.12 | 0.68 | 0.46 | 99,488 | ~97 |
| `report -c … --format json --out …` | `--no-cache` | 1.34 | 0.98 | 0.53 | 98,484 | ~96 |
| `sync -c … --dry-run` | `--no-cache` | 1.37 | 1.16 | 0.50 | 107,372 | ~105 |
| `review -c …` | `--no-cache` | 1.35 | 1.02 | 0.49 | 98,700 | ~96 |

On this smaller tree **warm vs cold** is modest compared to **[large-repo cache effects](.#cli-project-cache)**.

### Exclude & cache pointers

[**Exclude**](../config/exclude.md) and [**CLI project cache**](../cli/cache.md) matter most when **`src`** is wide ([Performance hub](.)). This **`apps/web`** config uses **`exclude.preset: 'production'`**.

### Example: run from home with `-c`

```bash
export CEPAT_WEB="$HOME/Projects/CepatEdge/apps/web/i18nprune.config.ts"

/usr/bin/time -f '%E wall · %M KB max RSS' i18nprune doctor -c "$CEPAT_WEB"
/usr/bin/time -f '%E wall · %M KB max RSS' i18nprune validate --no-cache -c "$CEPAT_WEB"
```

## When to use `/usr/bin/time`

| Situation | Use GNU `time`? |
|-----------|----------------|
| Daily: “does `validate` pass?” | No |
| Before/after `exclude` / `src` tweaks | Optional — **`%E %M`** once |
| Publishing perf comparisons | Yes — **`/usr/bin/time`**, **`/dev/null`** policy, **`--no-cache`** as needed; Fish → **`/usr/bin/time`** |

## How many commands?

| Tier | Runs (typical) | Purpose |
|------|----------------|---------|
| **Core loop** | **3** | Doctor + config + validate. |
| **PR / release** | **+2** (+ optional **`sync --dry-run`**) | `validate --json`, `report`. |
| **Deep hygiene** | **+4 optional** | `missing`, `review`, `cleanup --check-only`, `quality`. |

### Tier 1 — Core loop

```bash
export CEPAT_WEB="/path/to/CepatEdge/apps/web/i18nprune.config.ts"

i18nprune doctor -c "$CEPAT_WEB"
i18nprune config -c "$CEPAT_WEB"
i18nprune validate -c "$CEPAT_WEB"
```

### Tier 2 — PR / release

```bash
i18nprune validate --json -c "$CEPAT_WEB"
i18nprune report --format json --out reports/i18nprune-report.json -c "$CEPAT_WEB"
i18nprune sync --dry-run -c "$CEPAT_WEB"   # optional
```

### Tier 3 — Deep hygiene

```bash
i18nprune missing --dry-run -c "$CEPAT_WEB"
i18nprune review -c "$CEPAT_WEB"
i18nprune cleanup --check-only -c "$CEPAT_WEB"
i18nprune quality -c "$CEPAT_WEB"   # optional
```

## CepatEdge-specific config hints

- **`functions`** — Match i18next / wrappers ([config](../config), [dynamic](../dynamic)).
- **`src`** — **`apps/web/src`** only → **269** scanned files vs **Next.js** whole-repo **`src: '.'`** (~**20k**).
- **`exclude`** — extend with **`patterns`** / **`--exclude`** if you widen the scan.

## Related docs

| Topic | Link |
|--------|------|
| Commands | [Commands](../commands) |
| Report | [Report command](../commands/report) |
| Exclude | [Exclude](../config/exclude.md) |
| CLI cache | [CLI cache](../cli/cache.md) |
| Global flags | [CLI overview](../cli) |
| Large repo timings | [Next.js case study](./nextjs.md) |
