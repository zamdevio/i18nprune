---
description: ADR 007 — stable CLI --json envelope (ok, kind, data, issues, meta.apiVersion) for automation and CI.
---

# ADR 007 — CLI JSON envelope contract

**Status:** Accepted  
**Date:** 2026-05-09  
**Deciders:** Abdisamed Mohamed  
**Related ADRs:** [ADR 006](./006-command-orchestrator-boundary.md) (orchestrator boundary)

## Context

CI pipelines, editors, and custom wrappers need a **stable machine-readable** surface from the CLI. Human-oriented stderr (banners, progress, summaries) must not leak into stdout when integrators expect a single JSON document. Refactors and new subcommands repeatedly touched this boundary; parity tests now freeze envelope shape, exit codes, and issue codes on the sample fixture.

## Decision

1. **Canonical contract** lives only in [JSON output (`--json`)](../../cli/json.md) — one envelope: `ok`, `kind`, `data`, `issues[]`, `meta` (with `apiVersion`).
2. **`--json` applies only** when the subcommand is listed in `COMMANDS_WITH_JSON_OUTPUT` (`packages/cli/src/constants/jsonoutput.ts`). Passing `--json` on other commands does not switch stdout to JSON.
3. **Issue codes are API** — stable `i18nprune.*` identifiers; display copy may change; codes are not renamed without a deliberate breaking release.
4. **JSON path rules:** one primary JSON document on stdout; no `printCommandSummary` second line; progress and prompts stay off stdout (stderr or suppressed).
5. **Report split:** `report --format json --out` writes a project-report document; `report --json` emits the CLI envelope with `data.document` — different contracts, both documented in [json.md](../../cli/json.md).
6. **`meta.apiVersion` vs npm semver:** envelope contract version (`"1"` today) is independent of `@i18nprune/core` package semver (`0.1.x`). Bump `apiVersion` only when envelope semantics change — see [JSON output § Version fields](../../cli/json.md#version-fields).

## Implementation

```bash
# CI gate: fail on issues or ok=false
i18nprune validate --json | jq -e '.ok and ((.issues | length) == 0)'
```

```typescript
// Envelope shape (illustrative)
type CliJsonEnvelope = {
  ok: boolean;
  kind: string;
  data: Record<string, unknown>;
  issues: Array<{ code: string; severity: string; message?: string; docHref?: string }>;
  meta: { apiVersion: string; cwd: string };
};
```

## Consequences

### Positive

- One jq-friendly contract across supported commands.
- Parity tests catch accidental envelope or exit-code drift during refactors.

### Negative

- Every new JSON-capable command must update `COMMANDS_WITH_JSON_OUTPUT` and implement a thin JSON path in `run.ts`.
- Optional `data` fields evolve; consumers should tolerate unknown keys.

### Mitigation

- [Solved: CLI `--json` command parity](../../edge-cases/solved/cli-json-command-parity.md) documents the `COMMANDS_WITH_JSON_OUTPUT` pitfall.
- [jq cookbook](../../examples/jq-cookbook.md) shows robust CI predicates.

## Alternatives Considered

### Per-command ad hoc JSON schemas

- **Pros:** Maximum flexibility per command.
- **Cons:** No shared `ok` / `issues[]` semantics; CI scripts fragment.

### SDK-only machine output (no CLI envelope)

- **Pros:** Smaller CLI surface.
- **Cons:** Forces subprocess or duplicate wiring for shell/Actions users.

## References

- [JSON output (`--json`)](../../cli/json.md)
- [Issues hub](../../issues/README.md)
- [Solved: CLI `--json` command parity](../../edge-cases/solved/cli-json-command-parity.md)
- Git: parity snapshot tests under `tests/parity/`; `packages/cli/src/constants/jsonoutput.ts`
