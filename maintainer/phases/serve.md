# Phase — `i18nprune serve` (stdio transport)

**Status:** **in progress** — S.1 (transport skeleton) + S.2 (read ops) + S.3 (progress + pre-dispatch cancel) landed; S.4–S.6 pending.
**Tracker:** [`focus.md`](./focus.md) · **Contract:** [ADR 012](../../docs/architecture/decisions/012-cli-serve-transport.md) · **User docs (when built):** `docs/cli/serve.md`
**Implementation home:** `packages/cli/src/serve/` (transport only — ops stay in core `runXxx`)
**Consumers:** Tauri desktop (planned, develops outside this repo until migration), VS Code extension (own branch), scripted / SSH clients

**Goal:** Expose the existing core operation surface over **stdio JSON-RPC** so hosts can drive i18nprune without re-implementing it and without port forwarding through WSL or SSH.

---

## Why this is a host concern, not a core one

- [ADR 006](./../agents/architecture.md) — command modules orchestrate; reusable logic lives in core `runXxx`. `serve` adds **routing**, not logic.
- ADR 011 — core is runtime-neutral: no `process.*`, no `console.*`, no stdio. A server owns all three, so it cannot live in core.
- The transport must wrap the ops that already exist. If a client needs something core cannot express, **extend core first** (see [`architecture.md`](../agents/architecture.md) §13).

---

## The two shapes this has to serve

| Shape | Invocation | Why stdio wins |
|-------|-----------|----------------|
| **Windows desktop → project in WSL distro** | `wsl.exe -d <distro> -- node <cli> serve --project <path>` | No port forwarding across the WSL boundary, no firewall prompt |
| **Desktop → remote host** | `ssh <host> i18nprune serve --project <path>` | No inbound port opened on the remote machine; `--project` confines it |
| **Local desktop, many projects** | `i18nprune serve` (hub mode) | One process, roots supplied per request, per-root context cache |

Both remote shapes are stdio pass-through. An HTTP-only design would need port forwarding and auth on day one to cover the same ground.

---

## Non-negotiables

1. **stdout is protocol-only.** One JSON object per line, nothing else. Banners, logs, cache/debug, progress → **stderr**. A stray `console.log` corrupts the stream and the failure is silent.
2. **No domain logic in the transport.** Every method delegates to a core `runXxx`.
3. **Reuse the CLI envelope** for results (`ok` / `kind` / `data` / `issues[]` / `meta`) — see [JSON output](../../docs/cli/json.md).
4. **Writes are opt-in per session** via `--allow-writes`; read-only is the default posture.
5. **Fail closed on protocol version.** Never best-effort parse an unknown version.
6. **Not a `--json` command** — excluded from `COMMANDS_WITH_JSON_OUTPUT` (`packages/cli/src/constants/jsonoutput.ts`).
7. **Two root modes, never mixed.** `serve --project <path>` is *sandbox* (pinned, confined); `serve` alone is *hub* (root required per request). A pinned server rejects a different root — never switches.
8. **Per-root context map, serialized writes.** Disk cache is safe by construction (`computeCacheProjectId()` hashes the absolute root); the in-memory `CoreContext` + `localeRead` are not, so they are keyed per root with a bounded LRU and invalidated after writes.
9. **stdin close is the primary stop signal**; `--idle-timeout` is a backstop, `ping` resets it.
10. **No client id in v1**, and no proxying of undocumented core internals.

---

## Slices

Status: **planned** — one slice per PR; parity fixtures unchanged unless a slice is explicitly scoped to touch them.

| Slice | Scope | Exit criteria |
|-------|-------|---------------|
| **S.1 — Transport skeleton** ✅ | `packages/cli/src/serve/` — NDJSON framing, `initialize` / `shutdown` / `exit` / `ping`, capability report, version negotiation, sandbox vs hub root modes, stdin-close + idle timeout | Conformance test: exact stdout byte framing; non-protocol stdout bytes fail the test; confined root rejects a different root |
| **S.2 — Read ops** ✅ | `op.config` · `op.doctor` · `op.validate` · `op.languages` · `op.providers` | Results byte-equal the `--json` envelope for the same fixture |
| **S.3 — Progress + cancel** ⚠️ | Map `RunEvent` → `$/progress` (op-keyed); `$/cancelRequest` | **Landed as far as core allows:** `op.validate` streams `$/progress`; a request cancelled before dispatch returns `SERVE_REQUEST_CANCELLED`. **Real mid-flight cancel is blocked on core** — nothing accepts an `AbortSignal`, so `capabilities.cancel` is honestly `false`. See note below. |
| **S.4 — Write ops (opt-in)** | `op.sync` · `op.generate` · `op.cleanup` · `op.locales.delete` behind `--allow-writes`; per-root serialization + context invalidation | Writes refused when read-only; that root's `CoreContext` / `localeRead` invalidated after write |
| **S.5 — Client docs + smoke** | `docs/cli/serve.md`, `docs/commands/README.md` row, sidebar entry, manual `wsl.exe` / `ssh` smoke note | A documented command a user can copy-paste actually works |
| **S.6 — Optional HTTP transport** | `127.0.0.1` only, bearer token on stderr, hub mode only | Only if a real client needs it; never the default |

**Ship order:** S.1 → S.2 → S.3 → S.4 → S.5, with S.6 gated on demand.

### S.3 note — why `cancel` is advertised `false`

Cancellation is only real if an in-flight op can be interrupted. **Core accepts no `AbortSignal`** anywhere (verified: no `signal`/`abort` plumbing in `packages/core`), and every `serve` op is synchronous JS on the dispatch queue, so `$/cancelRequest` cannot stop work already running. Rather than advertise `cancel: true` and no-op on the wire, S.3 ships:

- `$/progress` forwarding for ops whose core path emits `run.*` events (today: `validate`, via `runValidate`; `config`/`doctor`/`providers` call `runXxx` directly and emit nothing, so they are not listed).
- `$/cancelRequest` that aborts a request **before** its dispatch microtask runs (refused with `SERVE_REQUEST_CANCELLED`), and marks a running request's signal aborted for future use.
- `capabilities.cancel = false` and `SERVE_CANCELLATION_SUPPORTED = false`, with progress advertised truthfully per-op via `capabilities.progressOps`.

**To make `cancel` true:** thread an `AbortSignal` through the long-running core ops (generate/sync) and check it at their natural await boundaries; then flip `SERVE_CANCELLATION_SUPPORTED`.

---

## Acceptance (whole phase)

- An editor/desktop client can `initialize`, run a read op, and receive the same envelope `--json` produces.
- A sandbox session (`--project`) rejects any request naming a different root.
- A hub session runs two different projects without cross-contamination (per-root context + `localeRead`).
- Long-running ops stream progress and can be cancelled without leaking the process; closing stdin exits cleanly.
- Windows → WSL and SSH invocations are documented and verified by hand at least once.
- No non-protocol bytes on stdout under any op, including failures and unhandled errors.
- A read-only session cannot write to disk through any method.

---

## Open questions (remaining)

1. **Progress granularity** — every `run.message`, or only `run.progress.*`? Affects client noise. Suggestion: `run.progress.*` plus `run.completed`, opt-in verbose for everything.
2. **Hub-mode root allow-list** — in hub mode (especially over SSH), should `--root-allow <glob>` restrict roots a client may name? **Required before exposing hub mode over a network** — without it a hub session is remote read access to every path the OS user can read.

**Resolved:** no client id in v1 (§10) · writes are a flag (§11) · stdin-close primary with idle backstop (§12) · sandbox + hub modes, mutually exclusive (§9) · idle timeout default `900` s, `0` disables (§1) · per-root context LRU cap `8` (§3).

---

## Non-goals

- Replacing any CLI command's human output
- Moving `runXxx` logic into the transport
- A hosted/multi-tenant server
- Auto-install, self-update, or executing client-supplied shell on a remote host
- A second extraction or cache engine for hosts

---

## Related

- [ADR 012 — serve stdio transport](../../docs/architecture/decisions/012-cli-serve-transport.md)
- [Ops entrypoints map](../systems/operations/entrypoints.md) — the `runXxx` surface wrapped here
- [`phases/extension/README.md`](./extension/README.md) — the other host, own branch
- [`systems/platform.md`](../systems/platform.md) — WSL / Windows path policy this phase interacts with
