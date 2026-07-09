# Core & foundation (W15–W19)

## 2026-W19

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **@i18nprune/core** | Monorepo package; CLI delegates | [`sdk/operations`](../../../docs/sdk/operations.md) |
| **VitePress docs** | `apps/docs` public site | [`docs/`](../../../docs/) |
| **Apps scaffold** | web, report, landing, workers | `apps/` |

## 2026-W16

| Slice | Receipt |
|-------|---------|
| **pnpm workspace** | Workspace + lockfile setup |

## 2026-W15 · Genesis

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **CLI commands** | validate, cleanup, missing, sync, quality, review, … | [`docs/cli`](../../../docs/cli/README.md) |
| **Locales** | list, dynamic, delete, `--json` | [`commands/locales`](../../../docs/commands/locales/README.md) |
| **`missing`** | Scaffold keys into locale JSON | [`commands/missing`](../../../docs/commands/missing.md) |
| **`sync` engine** | Preserves structured `{ value }` leaves | [`commands/sync`](../../../docs/commands/sync.md) |
| **Key observations** | Literal scan + validate JSON | [`architecture/extraction`](../../../docs/architecture/extraction/README.md) |
| **Key reference + preserve** | Uncertain-key policy, `--ask` | [`config/policies`](../../../docs/config/policies.md) |
| **Exports + `--json`** | Stable envelope + issue codes | [cli-json parity](../../../docs/edge-cases/solved/cli-json-command-parity.md) |
| **ADR 006** | Core data-only; hosts present | [`ADR 006`](../../../docs/architecture/decisions/006-command-orchestrator-boundary.md) |
| **Integration tests** | Sample fixture + parity | [`tests/fixtures/sample-i18n`](../../../tests/fixtures/sample-i18n) |
