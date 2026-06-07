# JSON output (`--json`)

Canonical machine-readable CLI contract.

## Envelope shape

Commands that support global `--json` emit:

```json
{
  "ok": true,
  "kind": "<command-id>",
  "data": {},
  "issues": [],
  "meta": { "apiVersion": "1", "cwd": "..." }
}
```

`issues[]` carries stable issue codes and optional docs links (`docHref` / `docPath`).

## Version fields

### `meta.apiVersion` (envelope contract)

`meta.apiVersion` is the **CLI JSON envelope contract version**, not the npm package version.

- Current value: `"1"`.
- Declared in code as `RESULT_API_VERSION` and emitted on every `--json` envelope.
- **Bump `apiVersion` only** when the envelope shape or cross-command semantics change (for example removing `issues[]`, renaming `ok`, or changing global failure rules).
- Additive changes inside `data` or new optional issue fields do **not** require an envelope bump.

### npm package version (`i18nprune` / `@i18nprune/core`)

The semver on npm (today `0.1.x`) tracks **package releases**. Pre-1.0 semver allows additive CLI/SDK behavior while the envelope stays at `apiVersion: "1"`.

At **1.0.0** you are committing that npm semver follows normal consumer expectations and `meta.apiVersion: "1"` remains the envelope contract until a deliberate `"2"` migration is documented.

### Issue codes

`issues[].code` values (for example `i18nprune.validate.missing_literal_keys`) are stable API. Display text and `docHref` may change; codes are not renamed without a documented breaking release.

## Commands with primary JSON envelopes

`config`, `validate`, `missing`, `sync`, `generate`, `quality`, `review`, `cleanup`, `languages`, `doctor`, `report`, and `locales` subcommands (`list`, `dynamic`, `delete`).

## Long-running command behavior

- `--json` disables interactive prompts for required inputs.
- Human progress rendering stays on stderr (TTY), never mixed into stdout JSON.
- JSON consumers should parse the final envelope document from stdout.

## Report JSON vs CLI JSON

- `i18nprune report --format json --out ...` writes project-report document (`kind: "i18nprune.projectReport"`).
- `i18nprune report --json` emits CLI envelope (`kind: "report"`) with `data.document`.

## Related

- [Commands](../commands/README.md)
- [SDK operations](../sdk/operations.md)
- [jq cookbook](../examples/jq-cookbook.md)
