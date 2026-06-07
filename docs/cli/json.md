---
description: Global --json contract for CI and automation — envelope shape, cross-command rules, version fields, and per-command notes.
---

# JSON output (`--json`)

The global **`--json`** flag switches supported commands from human-oriented stderr/stdout to a **stable machine-readable contract** on stdout. Use it in CI, scripts, and editor integrations when you need deterministic parsing — not for day-to-day terminal work (see [verbosity](./verbosity.md) for human output).

## What `--json` guarantees

| Rule | Behavior |
|------|----------|
| **Stdout** | One primary JSON document per invocation (pretty-print optional via `--json-pretty`) |
| **Stderr** | Human progress, cache/debug lines, and banners — never mixed into the JSON document |
| **Prompts** | Disabled on JSON-capable commands; missing required input fails fast with an envelope or usage error |
| **`ok`** | Top-level success gate — scripts should use exit code **and** `ok` (see [jq cookbook](../examples/jq-cookbook.md)) |
| **`issues[]`** | Stable `i18nprune.*` codes with optional `docHref`; warnings do not always imply `ok: false` |
| **`kind`** | Command id (`validate`, `sync`, `providers`, …) — parse this before assuming `data` shape |
| **`data`** | Command-specific payload; additive fields are allowed within the same `apiVersion` |

Commands that do not implement `--json` ignore the flag (for example `help`). The supported set is listed below.

## Envelope shape

Every JSON-capable command emits the same top-level object:

```json
{
  "ok": true,
  "kind": "<command-id>",
  "data": {},
  "issues": [],
  "meta": { "apiVersion": "1", "cwd": "..." }
}
```

`issues[]` entries include `code`, `severity`, `message`, and often `docHref` / `docPath` for published issue docs.

## Version fields

### `meta.apiVersion` (envelope contract)

`meta.apiVersion` is the **CLI JSON envelope contract version**, not the npm package version.

- Current value: `"1"`.
- Declared in code as `RESULT_API_VERSION` and emitted on every `--json` envelope.
- **Bump `apiVersion` only** when the envelope shape or cross-command semantics change (for example removing `issues[]`, renaming `ok`, or changing global failure rules).
- Additive changes inside `data` or new optional issue fields do **not** require an envelope bump.

### npm package version (`i18nprune` / `@i18nprune/core`)

The semver on npm (today `0.1.x`) tracks **package releases**. Pre-1.0 semver allows additive CLI/SDK behavior while the envelope stays at `apiVersion: "1"`.

### Issue codes

`issues[].code` values (for example `i18nprune.validate.missing_literal_keys`) are stable API. Display text and `docHref` may change; codes are not renamed without a documented breaking release.

## Commands with JSON envelopes

| `kind` | Command | Notes |
|--------|---------|--------|
| `config` | `i18nprune config` | Resolved config snapshot |
| `validate` | `i18nprune validate` | Key observations, missing keys, suggestions |
| `missing` | `i18nprune missing` | Scaffold plan + suggestions |
| `sync` | `i18nprune sync` | Merge/prune summary |
| `generate` | `i18nprune generate` | Progress + translate outcome |
| `quality` | `i18nprune quality` | Drift / parity findings |
| `review` | `i18nprune review` | Locale summaries |
| `cleanup` | `i18nprune cleanup` | Removable keys, optional `targets[]` |
| `languages` | `i18nprune languages` | Catalog listing |
| `providers` | `i18nprune providers` | Translation backend discovery (read-only) |
| `doctor` | `i18nprune doctor` | Environment + config checks |
| `report` | `i18nprune report --json` | CLI envelope wrapping `data.document` |
| `locales` | `locales list` / `dynamic` / `delete` | Per-subcommand payloads |

SDK equivalents live under [`sdk/operations`](../sdk/operations.md); CLI envelopes are thin wrappers around the same core results.

## Long-running and streaming behavior

- Progress for `generate` and similar ops uses structured events internally; the **final** stdout line(s) still resolve to one envelope (or documented multi-line JSON only where explicitly noted).
- `--quiet` / `--silent` reduce human stderr; they do **not** remove the JSON document when `--json` is set.
- Presentation flags (`--no-color`, `--no-log-prefix`, …) affect human lines only — see [output](./output.md).

## Command-specific notes

### Report: two JSON outputs

- `i18nprune report --format json --out …` writes a **project report document** (`kind: "i18nprune.projectReport"`) to a file.
- `i18nprune report --json` emits the **CLI envelope** (`kind: "report"`) with `data.document` on stdout.

### Providers discovery

`i18nprune providers --json` returns registered translation backends (`id`, `label`, `kind`, `envVars`, `configSnippets`) — no locale writes. Example shape:

```json
{
  "ok": true,
  "kind": "providers",
  "data": {
    "providers": [{ "id": "google", "label": "Google Translate", "kind": "public_http", "envVars": [] }],
    "mergePrecedence": "CLI --provider → env I18NPRUNE_TRANSLATE_PROVIDER → config translate.primary → …",
    "configSnippets": { "google": "translate: { primary: 'google', … }" }
  },
  "issues": [],
  "meta": { "apiVersion": "1", "cwd": "/path/to/project" }
}
```

See [`providers`](../commands/providers.md) for human output.

## Related

- [Commands index](../commands/README.md)
- [SDK operations](../sdk/operations.md)
- [jq cookbook](../examples/jq-cookbook.md)
- [CLI JSON envelope ADR](../architecture/decisions/007-cli-json-envelope-contract.md)
