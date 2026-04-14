# `review`

Per-locale summary: string path counts and **English-identical** counts vs the source locale.

```bash
i18nprune review
i18nprune review --target ja
i18nprune --json review
```

**`--json`** emits a structured **`localeReview`** object on stdout.

## Human mode (today)

Human **`review`** uses **CepatEdge-compatible ANSI** (same tokens as `~/Projects/CepatEdge/apps/web/scripts/locales/shared/ansi.ts`): dim **bold orange** **`[i18nprune]`**, dim **bold** **`[review]`**, **green** **`[info]`**, **yellow** **`[warn]`** for dynamic-call counts, **cyan** section and locale headings, and dim secondary “tip” lines. Implementation: `packages/cli/src/core/review/humanLog.ts` + `commands/review/run.ts`.

## Planned behaviour (machine + human)

The **`review`** command will grow toward a full **locale metadata** report: structured leaves (value, status, confidence, **`needsReview`**, source, updated-at style fields) when your locale JSON carries that metadata. It does **not** replace **`quality`** / **`validate`** for **`en.json` parity** — those stay separate concerns.

### Human mode

- Print an **applied options** line block: effective **`--target`**, filters, **`localesDir`**, scope — respect **`-q` / `-s`** (no duplicate noise).

### Output routing (planned)

- **`--csv`** → CSV on stdout (exclusive with JSON).
- **`--json`**:
  - With **`--format by-source`** → grouped JSON by source.
  - With **`--format by-status`** → grouped JSON by status.
  - Otherwise → **flat** JSON.
- **`--format summary|by-status|by-source`** without **`--json`** / **`--csv`** → **human** layout.

**`--json` and `--csv` are mutually exclusive** (error if both).

### Human format variants (planned)

- **`summary`** — compact stats per locale (default).
- **`by-status`** / **`by-source`** — path lists with caps.

### List caps (planned)

- **`--top N`** — parsed today as a **positive integer** (same error rules as **`missing --top`**). Until per-path human lists ship, this flag is **reserved** but validated so scripts fail fast on typos (`review: --top must be a positive integer`).
- **`--full`** — reserved alongside **`--top`** for unbounded path lists when that output exists.
- Default sample when neither: a small fixed cap (e.g. **10** rows) for human lists, flat JSON, and CSV slices — unless **`--full`** or **`--top`** overrides.

### Filters and flags (planned)

| Flag | Role |
|------|------|
| **`--format`** (`summary` / `by-status` / `by-source`) | Human layout; use **`--json`** / **`--csv`** for machine sinks (not `format=json` on the CLI). |
| **`--json`** | Machine JSON on stdout (variant depends on **`--format`**). |
| **`--csv`** (optional alias for typos) | Machine CSV on stdout. |
| **`--all`** | All non-source locales (default scope where applicable). |
| **`--target`**, multi-lang argv (planned) | Restrict which locale files. |
| **`--full`** | Unbounded lists (subject to **`--top`**). |
| **`--top N`** | Cap paths per section or flat rows. |
| **`--needs-review`** | Filter rows that need review. |
| **`--status`** (`pending` / `translated`) | Filter by status. |
| **`--source <name>`** | e.g. provider or provenance label. |
| **`--min-confidence` / `--max-confidence`** | Numeric filters. |

### Current vs planned

- **Today:** per-locale string path counts + English-identical counts vs source; **`review --top`** / **`review --full`** are accepted and validated but do not change output until path lists are implemented.
- **Next:** format switches, filters, CSV, applied-options banner, and richer stats when locale JSON includes review metadata.

## Related

- [JSON mode and long commands](../../behavior/json-long.md) — **`--json`**, prompts, progress
- [Roadmap](../../roadmap/README.md) — **`--report-file`** and review sequencing
