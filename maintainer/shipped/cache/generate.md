# Generate & translate engine (2026-W20)

| Slice | Receipt | User docs |
|-------|---------|-----------|
| **Generate** | Core translate path, `--json`, progress envelope | [`commands/generate`](../../../docs/commands/generate.md) |
| **Fill → generate --resume** | `fill` command removed | [`commands/generate`](../../../docs/commands/generate.md) |
| **Translate policy** | Classifier → resolver → `runGenerate` | [`config/translate`](../../../docs/config/translate.md) |
| **Translation providers (A)** | Progress bar, concurrency, routing, fallback | [`config/translate`](../../../docs/config/translate.md) |
| **Core-op architecture (A.2)** | All ops → `runXxx`; thin CLI host | [`ADR 006`](../../../docs/architecture/decisions/006-command-orchestrator-boundary.md) |

**Related:** translate/cache layers → [`cache.md`](./cache.md) · init/locales → [`init.md`](./init.md)
