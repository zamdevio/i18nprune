# `review`

Per-locale summary: string path counts and **English-identical** counts vs the source locale.

```bash
i18nprune review
i18nprune review --lang ja
i18nprune --json review
```

**`--json`** emits a structured **`localeReview`** object on stdout.

## Planned behaviour (machine + human)

The **`review`** command will grow toward a full **locale metadata** report: structured leaves (value, status, confidence, **`needsReview`**, source, updated-at style fields) when your locale JSON carries that metadata. It does **not** replace **`quality`** / **`validate`** for **`en.json` parity** — those stay separate concerns.

### Human mode

- Print an **applied options** line block: effective **`--lang`**, filters, **`localesDir`**, scope — respect **`-q` / `-s`** (no duplicate noise).

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

- **`--top N`** or **`--top=N`** — explicit cap (**wins** over **`--full`** if both are set).
- **`--full`** — unbounded path lists when **`--top`** is not set.
- Default sample when neither: a small fixed cap (e.g. **10** rows) for human lists, flat JSON, and CSV slices — unless **`--full`** or **`--top`** overrides.

### Filters and flags (planned)

| Flag | Role |
|------|------|
| **`--format`** (`summary` / `by-status` / `by-source`) | Human layout; use **`--json`** / **`--csv`** for machine sinks (not `format=json` on the CLI). |
| **`--json`** | Machine JSON on stdout (variant depends on **`--format`**). |
| **`--csv`** (optional alias for typos) | Machine CSV on stdout. |
| **`--all`** | All non-source locales (default scope where applicable). |
| **`--lang`**, multi-lang argv | Restrict which locale files. |
| **`--full`** | Unbounded lists (subject to **`--top`**). |
| **`--top N`** | Cap paths per section or flat rows. |
| **`--needs-review`** | Filter rows that need review. |
| **`--status`** (`pending` / `translated`) | Filter by status. |
| **`--source <name>`** | e.g. provider or provenance label. |
| **`--min-confidence` / `--max-confidence`** | Numeric filters. |

### Current vs planned

- **Today:** paths + English-identical counts vs source.
- **Next:** format switches, filters, CSV, applied-options banner, and richer stats when locale JSON includes review metadata.

## Related

- [JSON mode and long commands](../../behavior/json-long.md) — **`--json`**, prompts, progress
- [Roadmap](../../roadmap/README.md) — **`--report-file`** and review sequencing
