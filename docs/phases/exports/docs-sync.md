# Docs Sync Plan (Exports Phase)

When exports or JSON contracts change, update docs in the same implementation window.

## Required docs updates

- `docs/exports/README.md`
- `docs/exports/core.md`
- `docs/exports/config.md`
- `docs/exports/examples.md`
- **`docs/json/README.md`** (canonical JSON / `--json` spec)

## Related config docs

- `docs/config/commands.md`
- `docs/config/env.md` (if env keys changed)

## Web/API docs

- `apps/web` API page(s) that describe programmatic usage and JSON output.

## Checklist

- [x] Update import examples to namespaced API where recommended (`docs/exports/core.md`, `docs/exports/examples.md`; run `pnpm run docs:sync` for Nextra).
- [x] Mark Stable vs Advanced APIs clearly (`docs/exports/core.md`).
- [x] JSON envelope + `--json` documented in `docs/json/README.md`.
- [x] `apps/web` API page aligned with namespaces + JSON behavior (when that site ships).
- [x] Verify cross-links after file moves (`grep` broken paths in `docs/`).
