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
