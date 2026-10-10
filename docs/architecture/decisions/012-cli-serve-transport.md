---
description: ADR 012 — `i18nprune serve` exposes the core operation surface over stdio JSON-RPC for editor and desktop hosts.
---

# ADR 012 — `serve` stdio transport for host clients

**Status:** Accepted — decision agreed; implementation lands in the slices
**Date:** 2026-10-10
**Deciders:** Abdisamed Mohamed
**Related ADRs:** [ADR 006](./006-command-orchestrator-boundary.md) (orchestrator boundary), [ADR 007](./007-cli-json-envelope-contract.md) (JSON envelope), [ADR 011](./011-runtime-neutral-sdk-host-model.md) (runtime-neutral host model)

## Context

Hosts beyond the CLI need the same intelligence the CLI already exposes: a **Tauri desktop app** (planned, developing separately), a **VS Code extension** (own branch), and scripted/remote clients. Today the only integration paths are:

1. **Subprocess + `--json`** — spawn `i18nprune validate --json`, parse one envelope, exit. Works, but pays process startup per call, cannot stream progress, cannot cancel, and has no session state.
2. **Import `@i18nprune/core` directly** — ideal for in-process TS hosts, but the desktop app is **not** a Node process: it may run on Windows while the project lives in a **WSL distro**, or reach the project over **SSH**.

Both transport shapes the desktop needs (Windows → WSL, and remote SSH) are **stdio pass-through** cases. A local HTTP server would require port forwarding through the WSL boundary and firewall exceptions on the remote host; stdio needs none.

Per [ADR 006](./006-command-orchestrator-boundary.md), transport is a **host** concern, not a domain concern. Per [ADR 011](./011-runtime-neutral-sdk-host-model.md), core stays runtime-neutral and exposes no `process.*`/`console.*`. A transport therefore belongs in the CLI, calling the existing `runXxx` entries.

## Decision

1. **`i18nprune serve` is a stdio JSON-RPC 2.0 server.** Newline-delimited JSON (NDJSON): one JSON object per line, UTF-8, no BOM, `\n` terminated. `JSON.stringify` escapes embedded newlines, so line framing is unambiguous without headers.
2. **stdout carries protocol messages only — nothing else, ever.** All banners, logs, cache/debug lines, and progress text go to **stderr**. This is the transport's load-bearing invariant.
3. **Methods are thin wrappers over existing `runXxx` entries.** `serve` adds no extraction, cache, or policy logic. If a client needs a capability core does not express, **extend core first**, then wrap it.
4. **Results reuse the CLI JSON envelope** (`ok`, `kind`, `data`, `issues[]`, `meta`) — the same contract as [`--json`](../../cli/json.md). Clients learn one result shape for both paths.
5. **The wire protocol is versioned separately** from npm semver and from `meta.apiVersion`. `serve` protocol version starts at `"1"` and is negotiated in `initialize`.
6. **stdio is the only transport in v1.** An optional HTTP transport is a later slice, localhost-bound only, and never the default.
7. **`serve` is not a `--json` command.** It is excluded from `COMMANDS_WITH_JSON_OUTPUT`; its stdout is the protocol stream, not an envelope.
8. **Writers are serialized per project.** At most one mutating operation per project root at a time; reads may interleave; distinct projects may run in parallel.
9. **Two root modes, mutually exclusive** — see [Project root modes](#project-root-modes). A pinned root stays **confined**: a request naming a different root is an error, never a silent switch.
10. **No client identity in v1.** The server does not require or use a client id; a future optional `clientInfo` is logged to stderr only.
11. **Writes are opt-in via `--allow-writes`**, default read-only. This guards against accidents, not a hostile client (the client spawns the server). In a read-only session the **project cache is forced read-only** (and its eager directory creation suppressed), so read ops touch no cache files or directories — read-only means no disk writes at all, not merely "no project mutation".
12. **Lifecycle: stdin close is the primary stop signal**, with `--idle-timeout <seconds>` as a backstop (`0` disables). `ping` resets the idle timer.

## Protocol

### Framing

```jsonc
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{…}}\n
{"jsonrpc":"2.0","id":1,"result":{…}}\n
```

Notifications omit `id`. Errors use the standard `error: { code, message, data? }` member.

### Handshake

`initialize` → `result`:

```jsonc
{
  "protocolVersion": "1",
  "serverInfo": { "name": "i18nprune", "version": "1.1.0", "node": "24.18.0" },
  "apiVersion": "1",
  "rootMode": "sandbox",
  "projectRoot": "/home/me/proj",
  "capabilities": { "ops": ["validate", "sync", "generate", "…"], "progress": true, "progressOps": ["validate"], "cancel": false, "writes": false }
}
```

The client must send `protocolVersion` and **fail closed** on an unsupported value rather than guess. `capabilities.writes` reports whether mutating ops are enabled for this session; `rootMode` is `"sandbox"` (pinned) or `"hub"` (per-request root). No client id is required or used in v1.

`capabilities.progress` is true when at least one op streams `$/progress`, and `progressOps` names exactly which ops do — a client must not assume every op reports progress. `capabilities.cancel` is `false` until core can be interrupted mid-op: with no `AbortSignal` in core, a running op cannot be stopped, and a capability the server cannot honour is not advertised. `$/cancelRequest` still refuses a request that has not started.

### Lifecycle and utility

| Method | Kind | Notes |
|--------|------|-------|
| `initialize` | request | Handshake; must be first |
| `shutdown` | request | Stop accepting new requests; drain in-flight |
| `exit` | notification | Terminate the process |
| `ping` | request | Liveness / keepalive; resets the idle timer |
| `$/cancelRequest` | notification | Cancel by request `id` |
| `$/progress` | notification | Server → client progress ticks |

### Project root modes

The server starts in exactly one of two modes; they are **mutually exclusive** and never mixed.

| Mode | Startup | Request `params.projectRoot` | Behavior |
|------|---------|------------------------------|----------|
| **Sandbox** | `i18nprune serve --project <path>` | omitted | Pinned to `<path>`. A request naming a *different* root is an **error** (`PROJECT_CONFINED`), never a silent switch |
| **Hub** | `i18nprune serve` (no `--project`) | **required** (absolute) | Multi-project; a missing root is an error |

**Why the confinement rule exists:** the desktop reaches a WSL distro or a remote box by spawning serve there. If a pinned server could be talked into operating on another root, the pin would mean nothing. Confinement is the security guarantee for `ssh <host> i18nprune serve --project <path>`.

**Per-root state (the real multi-project constraint):** the disk cache is safe by construction — `computeCacheProjectId()` hashes the normalized absolute project root, so two roots never share a cache directory. What **does** need care is the in-memory side: `CoreContext` is bound to one root and carries `localeRead`, a per-run locale cache. So:

- Cache one `CoreContext` per resolved root, with a bounded LRU so a long-lived server does not grow without limit.
- Invalidate that root's context and `localeRead` after any write to it, and when its config file changes on disk.
- Serialize writes per root (read-only ops may overlap).

### Operations

One method per op, mirroring the `runXxx` surface:

```jsonc
{"jsonrpc":"2.0","id":7,"method":"op.validate","params":{"projectRoot":"/home/me/proj","options":{"json":true}}}
```

| Method | Core entry | Mutating |
|--------|-----------|----------|
| `op.config` | `runConfig` / context resolve | no |
| `op.doctor` | `runDoctor` | no |
| `op.validate` | `runValidate` | no |
| `op.missing` | `runMissing` | no |
| `op.quality` | `runQuality` | no |
| `op.review` | `runReview` | no |
| `op.languages` | `runLanguages` | no |
| `op.providers` | `runProviders` | no |
| `op.locales.list` / `.dynamic` | locales ops | no |
| `op.sync` | `runSync` | **yes** |
| `op.generate` | `runGenerate` | **yes** |
| `op.cleanup` | `runCleanup` | **yes** |
| `op.locales.delete` | locales delete | **yes** |

Mutating methods return an error unless `capabilities.writes` is true for the session (set by `--allow-writes`). A read-only session resolves each root with the project cache forced read-only, so even these read methods write no cache state.

### Progress

`RunEvent` payloads from [`types/shared/run/`](../../../packages/core/src/types/shared/run/index.ts) map onto `$/progress` notifications keyed by request `id`: `params` is `{ id, event }`, with the event forwarded **verbatim**. Progress is a **side channel**: it never replaces or mutates the final result envelope. The server forwards only the **documented public surface**, never core internals.

Two honesty constraints:

- **Per-op, not universal.** Only ops whose core entry path emits `run.*` events stream progress — today `validate` (via `runValidate`). `config`, `doctor`, and `providers` call `runXxx` directly and emit nothing, so `capabilities.progressOps` lists just `["validate"]`.
- **Cancellation is pre-dispatch only.** `$/cancelRequest` aborts a request that has not started (it gets `SERVE_REQUEST_CANCELLED`). A request already running cannot be interrupted — core accepts no `AbortSignal` — so `capabilities.cancel` is `false`. Advertising otherwise would promise a hang-free cancel the server cannot deliver.

### Lifecycle details

| Signal | Behavior |
|--------|----------|
| **stdin closes** | Primary stop signal — the parent died. Drain, exit 0. Covers desktop crashes with no timer needed. |
| **idle timeout** | `--idle-timeout <seconds>` backstop; `ping` and any request reset it; `0` disables |
| **`shutdown`** | Stop accepting; drain in-flight; await `exit` |
| **`exit`** | Terminate immediately after drain |
| **unsupported protocol version** | Fail closed with a clear error before serving any op |

## Security

| Concern | Rule |
|---------|------|
| **Network** | None in v1 — stdio only, no listener. An optional HTTP transport binds `127.0.0.1` only, with a bearer token emitted to stderr. |
| **Path scope** | Reject `projectRoot` / path params that escape the session root; in sandbox mode a different root is an error, never a switch. Root equality is compared on resolved paths (not realpaths) — a symlink alias of the pinned root is rejected rather than accepted, which fails closed. |
| **Secrets** | Provider keys and env values are never echoed in results, errors, or logs. |
| **Remote hosts** | Connecting over SSH is a client decision; the server never installs itself, never self-updates, and never executes client-supplied shell. |
| **Writes** | Mutating ops are opt-in per session (`capabilities.writes`); a read-only session also forces the project cache read-only, so it writes no cache state. A read-only host cannot prune locales or touch the cache by accident. |
| **stdout purity** | A stray `console.log` corrupts the stream. Enforced by tests, not convention alone. |

## Consequences

### Positive

- One transport covers **Windows → WSL** and **SSH** with no forwarding code: `wsl.exe -d <distro> -- node <cli> serve` and `ssh host i18nprune serve`.
- Hosts reuse the existing envelope contract and the existing op surface — no second engine, no drift.
- Progress and cancellation become possible, which `--json` subprocess polling cannot offer.

### Negative

- A long-lived process must manage lifecycle, concurrency, and cancellation — real state the CLI has never held.
- stdout purity becomes a new failure mode that is silent and hard to debug.
- Remote-client UX (installing the CLI on the far side) becomes product surface we own.

### Mitigation

- Conformance tests assert exact stdout byte framing and that no non-protocol bytes appear.
- Writes default to off; a read-only session is the common case.
- Protocol version negotiation fails closed, so old clients get a clear error rather than corrupt parsing.

## Alternatives Considered

### HTTP-only server

- **Pros:** Familiar, easy to test with `curl`, natural fit for browsers.
- **Cons:** Fails the WSL/SSH story without port forwarding and firewall work; adds auth requirements on day one. Kept as a later optional transport instead.

### LSP-style `Content-Length` framing

- **Pros:** Robust against embedded newlines; mature tooling.
- **Cons:** More parsing surface for both ends and no benefit here, since JSON-RPC messages are single-line encoded. NDJSON is simpler for a Rust client.

### Pinned root only (no hub mode)

- **Pros:** Simplest model; every request is implicitly scoped, so confinement is trivially true.
- **Cons:** A desktop juggling several projects would spawn one process per project, paying startup each time. Given the per-root context map is cheap and the cache is already hash-keyed, hub mode costs little — so both modes ship, kept strictly separate.

### Hosts shell out to `--json` per call

- **Pros:** Zero new surface.
- **Cons:** Per-call process startup, no progress streaming, no cancellation, no session context. Acceptable for CI, poor for an editor.

### Put the transport in `@i18nprune/core`

- **Pros:** One import location for TS hosts.
- **Cons:** Violates [ADR 011](./011-runtime-neutral-sdk-host-model.md) — a server owns `process.*`, stdio, and lifecycle, which core must never touch. Rejected.

## References

- [`maintainer/phases/serve.md`](../../../maintainer/phases/serve.md) — slice plan and acceptance criteria
- [JSON output (`--json`)](../../cli/json.md) · [ADR 007](./007-cli-json-envelope-contract.md)
- [Runtime overview](../../runtime/README.md) · [ADR 011](./011-runtime-neutral-sdk-host-model.md)
- [Platform support (Windows / WSL)](../../../maintainer/systems/platform.md)
- [Ops entrypoints map](../../../maintainer/systems/operations/entrypoints.md) — the `runXxx` surface this wraps
