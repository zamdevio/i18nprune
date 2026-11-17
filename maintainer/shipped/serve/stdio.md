# Serve — stdio JSON-RPC (S.1–S.5)

**Week:** 2026-W47 · **Tag:** **1.2.0**

## Shipped

| Slice | What |
|-------|------|
| **S.1** | NDJSON framing, `initialize` / `shutdown` / `exit` / `ping`, capabilities, sandbox vs hub, idle timeout |
| **S.2** | Read ops: `op.config` · `op.doctor` · `op.validate` · `op.languages` · `op.providers` |
| **S.3** | `$/progress` + `$/cancelRequest`; `cancelScope: 'running'` via core `AbortSignal` |
| **S.4** | Write ops behind `--allow-writes`: `op.sync` · `op.generate` · `op.cleanup` · `op.locales.delete` |
| **S.5** | User docs (`docs/cli/serve.md`), sidebar, command index; help points at the real page |

## Explicitly out

| Item | Disposition |
|------|-------------|
| **S.6 HTTP** | **Dismissed for now** — no client needs it; see [`systems/serve.md`](../../systems/serve.md) |
| Progress verbosity / hub `--root-allow` | Follow-ups only; not blockers |

## Code map

- `packages/cli/src/serve/`
- Cooperative cancel: `packages/core/src/shared/errors/abort.ts` (+ generate/translate signal wiring)
- User docs: `docs/cli/serve.md`

## Tests

- `packages/cli/src/serve/__tests__/` — handshake, roots, session, progress/cancel, write gating, stdio purity
