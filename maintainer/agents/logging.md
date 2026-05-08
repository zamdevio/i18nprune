# Logging for agents

Use **`packages/cli/src/utils/logger/`** for all terminal output:

- **Standard levels**: `logger.info`, `logger.warn`, `logger.err`.
- **Presentation helpers**: `detail`, `plain`, `primary`, `decorative`.
- **Run-aware logger**: prefer `loggerFor(ctx.run)` in command flows.
- **Policy gates**: honor policy helpers and run flags so quiet/silent/json behavior stays consistent.
- **Errors**: report user-facing failures through logger + command exit codes; avoid raw `console.*`.
- **Reports vs logs**: logger is for terminal UX; report files are emitted via `packages/cli/src/utils/report/`.
