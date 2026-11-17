# `serve` — stdio JSON-RPC host

**Audience:** Maintainers / agents — how `i18nprune serve` wraps core ops without owning domain logic.  
**User docs:** [`docs/cli/serve.md`](../../docs/cli/serve.md) · **ADR:** [`docs/architecture/decisions/012-cli-serve-transport.md`](../../docs/architecture/decisions/012-cli-serve-transport.md)  
**Phase / receipt:** [`phases/serve.md`](../phases/serve.md) · [`shipped/serve/stdio.md`](../shipped/serve/stdio.md)

**Lifecycle:** `stable` (stdio S.1–S.5) · **Last reviewed:** 2026-11-17

---

## Purpose

Expose existing `runXxx` ops over **JSON-RPC 2.0 / NDJSON on stdio** so editors, desktop hosts, and SSH/WSL sessions can drive i18nprune without re-implementing core and without opening a port.

---

## Primary artifacts

| Path | Role |
|------|------|
| `packages/cli/src/serve/` | Transport only — framing, session, roots, op routing |
| `packages/cli/src/serve/ops.ts` | Method → core `runXxx` / CLI entry adapters |
| `packages/core` cancel helpers | `AbortError` / `AbortSignal` for mid-flight cancel (`cancelScope: 'running'`) |
| Tests | `packages/cli/src/serve/__tests__/` |

**Not in core:** serve owns `process` / stdio / console-on-stderr. Core stays runtime-neutral.

---

## Modes

| Mode | Flag | Behavior |
|------|------|----------|
| **Sandbox** | `--project <path>` | Pinned root; ops naming another root are rejected |
| **Hub** | (no `--project`) | Client supplies `projectRoot` per request; per-root context LRU |

Writes require `--allow-writes`. Default is read-only.

---

## HTTP transport (S.6) — dismissed for now

**Do not implement loopback HTTP unless a real client cannot speak stdio.**

| | |
|--|--|
| **Why stdio is enough** | WSL (`wsl.exe … serve`), SSH, local editor/desktop all pass stdio. No port forward, no firewall prompt, no bearer token. |
| **What HTTP would buy** | Curl/browser convenience; hosts that only speak HTTP. |
| **What it costs** | Auth, bind mistakes (`0.0.0.0`), CORS, a second protocol surface, and hub “any path the OS user can read” exposure on a network. |
| **Rule** | If/when HTTP ships: `127.0.0.1` only, bearer on stderr, hub-only, never the default. |

---

## Follow-ups (not blockers)

Documented so we do not rediscover them mid-release. **Neither blocks stdio close-out.**

### 1. Progress granularity

`$/progress` can forward every `run.message` or only `run.progress.*` (+ completed).

- **Default posture:** quiet — progress ticks + completion.  
- **Why open:** client noise vs richness. Change only when a host asks for verbose.

### 2. Hub root allow-list

Hub mode can name any project path the OS user can read. Fine on a laptop; risky over SSH if the process is wide-open.

- **Sandbox (`--project`)** is already confined.  
- **`--root-allow <glob>`** (or similar) is required **before** exposing hub over a network — not required for local/sandbox close-out.

---

## Frozen surfaces

- Stdout = protocol frames only (one JSON object per line). Logs → stderr.
- Result envelope matches CLI `--json` (`ok` / `kind` / `data` / `issues` / `meta`).
- `serve` is **not** in `COMMANDS_WITH_JSON_OUTPUT`.
- Fail closed on unknown protocol version.

---

## Cross-links

- Ops map: [`operations/entrypoints.md`](./operations/entrypoints.md)
- Platform / WSL: [`platform.md`](./platform.md)
- Sprint focus: [`phases/focus.md`](../phases/focus.md)
