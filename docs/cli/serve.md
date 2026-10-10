---
description: i18nprune serve — drive i18nprune over stdio JSON-RPC from editors, desktop apps, and remote shells.
---

# `serve` (stdio transport)

`i18nprune serve` runs a long-lived process that speaks **JSON-RPC 2.0 over stdio**, one JSON object per line. It lets a host — an editor extension, a desktop app, or a scripted session — drive i18nprune without re-implementing it and without opening a port across a WSL or SSH boundary.

`serve` is **not** a normal command. Its stdout carries the protocol stream, not human output, and the global `--json` flag does not apply to it.

## Invocations

| Shape | Command |
|-------|---------|
| Pinned to one project (*sandbox*) | `i18nprune serve --project /path/to/app` |
| Many projects, root per request (*hub*) | `i18nprune serve` |
| Windows desktop → project in WSL | `wsl.exe -d <distro> -- node <cli> serve --project <path>` |
| Desktop → remote host | `ssh <host> i18nprune serve --project <path>` |

Both remote shapes are stdio pass-through: no port forwarding, no inbound port on the remote machine.

## Flags

| Flag | Role |
|------|------|
| `--project <path>` | Pin the session to one project root (sandbox mode). Omit for hub mode, where each request names its own root. |
| `--allow-writes` | Opt in to mutating operations. **Default: read-only.** |
| `--idle-timeout <seconds>` | Exit after this much inactivity. Default `900`; `0` disables the backstop. `ping` resets it. |

### Root modes

The two modes are mutually exclusive. In **sandbox** mode the root is pinned and **confined**: a request naming a different root is an error, never a silent switch. In **hub** mode, root is required per request.

## Read-only by default

Without `--allow-writes`, a session refuses every mutating method with a `SERVE_WRITES_DISABLED` error, and the project cache is forced read-only — so even read operations write no cache file or directory. Read-only means **no disk writes at all**, not merely "no project mutation". Add `--allow-writes` to enable `op.sync`, `op.generate`, `op.cleanup`, and `op.locales.delete`.

## Protocol

Stdio carries newline-delimited JSON: one request, response, or notification object per line. Diagnostics (`serve: ready`, cancel notices, internal errors) go to **stderr**.

### Handshake

Send `initialize` before anything else and **fail closed** on an unsupported `protocolVersion`:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1"}}
```

The result reports the server and what it can do:

```json
{"jsonrpc":"2.0","id":1,"result":{
  "protocolVersion":"1",
  "serverInfo":{"name":"i18nprune","version":"__I18NPRUNE_VERSION__","node":"v22.0.0"},
  "apiVersion":"1",
  "rootMode":"sandbox",
  "projectRoot":"/path/to/app",
  "capabilities":{
    "ops":["config","doctor","validate","languages","providers","sync","generate","cleanup","locales.delete"],
    "progress":true,
    "progressOps":["validate","sync","generate"],
    "writeOps":["sync","generate","cleanup","locales.delete"],
    "cancelScope":"queued",
    "writes":false
  }
}}
```

Feature-detect against `capabilities` — a method the server cannot honour never appears in `ops`.

| Field | Meaning |
|-------|---------|
| `ops` | Methods this server implements. |
| `writes` | Whether mutating ops are enabled (set by `--allow-writes`). |
| `writeOps` | The mutating methods, each refused unless `writes` is true. |
| `progress` / `progressOps` | `progress` is true when any op streams `$/progress`; `progressOps` names exactly which do. Do not expect progress from an op that is not listed. |
| `cancelScope` | Cancellation tier: `'queued'` refuses a request cancelled before it starts (a running op cannot be interrupted); `'running'` can abort mid-op; `'none'` is reserved. |

### Lifecycle methods

| Method | Kind | Notes |
|--------|------|-------|
| `initialize` | request | Required first. Params `{ protocolVersion }`. |
| `ping` | request | Returns `{}`; resets the idle timer. |
| `shutdown` | request | Marks the session as shutting down; awaits `exit`. |
| `exit` | notification | Ends the process. Closing stdin also ends it. |

## Operations

Every operation is `op.<name>`. Params are `{ projectRoot?, options? }` — `projectRoot` is required in hub mode and rejected when it differs from the pinned root in sandbox mode.

**Results reuse the [`--json` envelope](./json.md)** (`ok` / `kind` / `data` / `issues` / `meta`), so a client learns one result shape for both the CLI and the server.

### Read ops

| Method | Returns |
|--------|---------|
| `op.config` | Resolved config snapshot |
| `op.doctor` | Environment + config checks |
| `op.validate` | Key observations, missing keys, suggestions |
| `op.languages` | Locale catalog (no project config needed) |
| `op.providers` | Translation backend discovery |

### Write ops (`--allow-writes`)

| Method | Returns |
|--------|---------|
| `op.sync` | Merge/prune summary; writes changed locale files |
| `op.generate` | Progress + translate outcome; writes target locales |
| `op.cleanup` | Removable keys; writes the removals |
| `op.locales.delete` | Deletes locale segment files |

Write ops run best-effort patching and cache invalidation exactly as their CLI counterparts do, and drop that root's cached context afterwards so the next read sees the new files. They are non-interactive: a case the CLI would prompt for (missing `--target`, resume selection) comes back as an `ok: false` envelope with issues, never a hang.

## Progress

Ops whose core path emits run events stream `$/progress` notifications keyed by request id:

```json
{"jsonrpc":"2.0","method":"$/progress","params":{"id":2,"event":{"type":"run.progress.validate","phase":"scan"}}}
```

Progress is a side channel: it never alters the final result envelope. Only the ops in `capabilities.progressOps` stream it.

## Cancellation

Send the `$/cancelRequest` notification with the target request id:

```json
{"jsonrpc":"2.0","method":"$/cancelRequest","params":{"id":2}}
```

Cancellation is **pre-dispatch only**: a request that has not started is refused with `SERVE_REQUEST_CANCELLED`, but a request already running cannot be interrupted — nothing in core accepts an abort signal — so `capabilities.cancelScope` is honestly `'queued'`, not `'running'`.

## Errors

Errors use the standard JSON-RPC `error` object, with an i18nprune issue code under `error.data.code` (e.g. `SERVE_WRITES_DISABLED`, `SERVE_METHOD_NOT_FOUND`, `SERVE_REQUEST_CANCELLED`). See [CLI issues](../issues/cli.md) for the code catalog.

## Example session

```text
→ {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1"}}
← {"jsonrpc":"2.0","id":1,"result":{ ... }}
→ {"jsonrpc":"2.0","id":2,"method":"op.validate","params":{"options":{}}}
← {"jsonrpc":"2.0","method":"$/progress","params":{"id":2,"event":{ ... }}}
← {"jsonrpc":"2.0","id":2,"result":{"ok":true,"kind":"validate","data":{ ... },"issues":[],"meta":{ ... }}}
→ {"jsonrpc":"2.0","id":3,"method":"shutdown"}
← {"jsonrpc":"2.0","id":3,"result":{}}
→ {"jsonrpc":"2.0","method":"exit"}
```

## Related

- [JSON output (`--json`)](./json.md) — the envelope every op result reuses
- [CLI overview](./README.md)
- [ADR 012 — serve stdio transport](../architecture/decisions/012-cli-serve-transport.md)
