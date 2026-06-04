# Onboarding hub

## What is i18nprune?
i18nprune helps you keep translation keys and locale JSON in sync. When your code and locale files drift apart, you typically end up with missing keys, “dynamic” translation warnings, and extra review work to understand what is safe to change.

This hub helps you pick the fastest path based on how you will use i18nprune.

## Pick your path
- [CLI path](./cli.md) for day-to-day installs and workflows
- [SDK path](./sdk.md) for scripts, Workers, and custom hosts using `@i18nprune/core`
- [CI path](./ci.md) for `validate --json` gates and stable issue codes
- [Hosted surfaces](./hosted.md) for the web report UI and shared snapshots
- [Contributors](../contributors/README.md) if you want to help improve i18nprune

## Fastest win (try now)
Run validation and get a machine-readable result.

```bash
i18nprune validate --json | jq '{ok, missing: (.data.missing | length), dynamic: .data.dynamic.count}'
```

If `ok` is `true`, your source usage and source locale shape are aligned.

## Preview locale alignment (no disk writes)
```bash
i18nprune sync --dry-run --json | jq '.data.files[] | {path, changed}'
```

This simulates locale-file shape alignment without changing disk.

## Optional next action: apply the sync
If the preview output looks correct:

```bash
i18nprune sync --yes
```

## Keep it in CI
```bash
i18nprune validate --json | jq -e '.ok'
```

This fails the job when validation is not OK.

## Surfaces matrix
| Surface | Typical use |
|---------|--------------|
| npm CLI | Install + run common commands |
| `@i18nprune/core` | Programmatic SDK usage (`@i18nprune/core`) |
| `report.i18nprune.dev` | Open and troubleshoot report payloads |
| `workers.i18nprune.dev` | Prepare snapshots and serve shared metadata |
| VS Code extension (`apps/extension/`) | Editor host — **in development**, planned post-v1 (same core engine as CLI) |

## What to read next
- [Commands](../commands/README.md)
- [JSON output (`--json`)](../cli/json.md)
- [Issues reference](../issues/README.md)
- [jq cookbook](../examples/jq-cookbook.md)
