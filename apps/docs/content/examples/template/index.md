# Command Example Template

Use this template for each command example page under `docs/examples/commands/<command>/README.md`.

## Goal

One sentence about what this example proves.

## Preconditions

- Project root path / fixture path
- Required config path
- Required env vars (if any)

## Baseline command

```bash
# minimal real run
i18nprune <command> ...
```

## JSON + jq view

```bash
i18nprune --json <command> ... | jq '.data'
```

Add at least one focused `jq` selector for key operational metrics.

## Global flags coverage (required)

Add a compact section that shows applicable global flags for this command:

- `-c, --config`
- `--json` and `--json-pretty`
- `stdout redirection` + `--format` (for commands that support report artifacts)
- `-q, --quiet` / `-s, --silent` when human output behavior matters
- path overrides (`--source`, `--locales-dir`, `--src`) and `--functions` when relevant
- `--yes` for non-interactive write flows

## Timing / performance probe

```bash
time i18nprune <command> ...
```

Prefer one dry-run timing and one write timing when safe.

## Edge-case recipe

- Missing target/path behavior
- Non-interactive (`--json` / CI) behavior
- Conflict/precedence behavior (if command has it)

## Expected signals

- Human logs (info/warn lines)
- JSON fields expected
- Exit code expectation

## Related docs

- Command README
- Behavior/JSON docs
- Any policy-specific docs
