# Coding rules

Compact reference for humans and agents. For architecture details see [`architecture.md`](./architecture.md).

---

## TypeScript

- **ESM** — `"type": "module"`, `moduleResolution: NodeNext`.
- **`.js` extensions** on all relative imports.
- **`import type`** for type-only imports.
- **Strict mode** — no `any` unless unavoidable (document with inline comment).

## Output contract

- Respect `RunOptions` gates: `--json`, `--quiet` (`-q`), `--silent` (`-s`).
- Use `logger` (via `loggerFor(ctx.run)`) for all terminal output — never raw `console.*`.
- `--json` and non-TTY flows must not prompt; fail fast with actionable errors.
- Presentation helpers: `detail`, `plain`, `primary`, `decorative` — match existing usage patterns.

## Error handling

- Throw `I18nPruneError` with stable `code` (`'USAGE' | 'IO' | 'TRANSLATE'`) for fatal failures.
- Return `issues[]` for non-fatal warnings/info — issue codes are stable API.
- Decision hooks return typed discriminated unions (e.g. `IncompleteRunDecision`), not raw values.

## Testing

- **Unit tests:** colocated in `packages/*/src/**/__tests__/`.
- **Integration tests:** `tests/integration/` — runs built CLI against fixture.
- **Parity tests:** `tests/parity/` — byte-identical `--json` + human output snapshots.
- **Gate:** `pnpm typecheck` and `pnpm test` before commit. `pnpm vitest run tests/parity` for refactors.

## Logging

- Use `packages/cli/src/utils/logger/` — never bypass `canEmit` gates.
- `logger.info`, `logger.warn`, `logger.err` for standard levels.
- `loggerFor(ctx.run)` to get a run-aware logger in command flows.
- Reports (file output) use `packages/cli/src/utils/report/` — separate from interactive logger.

## Non-interactive safety

Commands with `--json` support are listed in `packages/cli/src/constants/jsonoutput.ts`. These must:
- Produce deterministic structured output
- Never prompt
- Set `process.exitCode` on failure (use `applyCliCiExitGate`)

## Commit discipline

See [`git.md`](./git.md) for full rules. Key points:
- One concern per commit — vertical slice or horizontal layer, never mixed.
- Code + docs together — command impl + `docs/commands/<slug>/README.md` in same commit.
- Conventional Commits: `feat(scope)`, `fix(scope)`, `refactor(scope)`, `docs(scope)`, etc.
- No drive-by churn — don't reformat unrelated files.

## Maintainer planning

- **Scratch** → `maintainer/temp/` (gitignored, never commit).
- **Sessions** → `maintainer/phases/final.md` + `maintainer/phases/active-phase.md`.
- **Public docs** → `docs/` only — never leak maintainer files into user-facing pages.
- **Hub:** `maintainer/README.md` → `maintainer/phases/README.md`.
