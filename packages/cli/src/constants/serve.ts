/**
 * `i18nprune serve` transport constants.
 *
 * These name the **wire** contract (`protocolVersion`) and the transport's own limits. They are
 * deliberately separate from npm semver and from the JSON envelope `meta.apiVersion` — see
 * [ADR 012](../../../../docs/architecture/decisions/012-cli-serve-transport.md) §5.
 */

/** Wire protocol revision. Bumped only on a breaking change to framing or method shape. */
export const SERVE_PROTOCOL_VERSION = '1';

/**
 * Core operation-surface revision this server wraps. Advertised as `apiVersion` in `initialize`
 * so a client can tell "new protocol, old engine" apart from "old client".
 */
export const SERVE_API_VERSION = '1';

/** Default `--idle-timeout` in seconds (15 min). `0` disables the backstop. */
export const SERVE_DEFAULT_IDLE_TIMEOUT_SECONDS = 900;

/**
 * Hard cap on one inbound request line. Guards the transport against an unbounded line when a
 * client streams a very large payload frame; oversize lines are rejected, never buffered forever.
 */
export const SERVE_MAX_LINE_BYTES = 16 * 1024 * 1024;

/** Default warm-root cap. A hub session keeps this many contexts before evicting the LRU. */
export const SERVE_DEFAULT_ROOT_CACHE_MAX = 8;

/** How long a cached root stays warm without a request before it is dropped (5 min). */
export const SERVE_ROOT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Op methods this server can actually serve, advertised in `capabilities.ops`.
 *
 * Kept **truthful**: a client feature-detects against this list, so a method that is not wired yet
 * must not appear here. Read ops landed in S.2; write ops join in S.4.
 */
export const SERVE_IMPLEMENTED_OPS: readonly string[] = [
  'config',
  'doctor',
  'validate',
  'languages',
  'providers',
  'sync',
  'generate',
  'cleanup',
  'locales.delete',
];

/**
 * Op methods that mutate disk; each is refused unless the session has `--allow-writes`. Every name
 * here must also appear in {@link SERVE_IMPLEMENTED_OPS} — a write op that is not implemented is a
 * mistake, not a reservation.
 */
export const SERVE_WRITE_OPS: ReadonlySet<string> = new Set<string>([
  'sync',
  'generate',
  'cleanup',
  'locales.delete',
]);

/**
 * Op methods that stream `$/progress` notifications. Only ops whose core entry path emits `run.*`
 * events qualify. `config`, `doctor`, and `providers` call `runXxx` directly and emit nothing;
 * `cleanup` is read-only in core and emits nothing; `locales.delete` emits nothing. A client must not
 * expect progress from an op that is not listed.
 */
export const SERVE_PROGRESS_OPS: ReadonlySet<string> = new Set<string>(['validate', 'sync', 'generate']);

/**
 * Whether this build can honour a cancellation of a *running* op.
 *
 * **`true` since slice C-signal.** `runGenerate` (translate pool, via `runTranslate`) accepts an
 * `AbortSignal` on `CoreContext` / its options and aborts at its natural await boundaries, so
 * `$/cancelRequest` can interrupt a running `op.generate` — not merely refuse a queued one. Short
 * local ops (`sync`, `cleanup`, `locales.delete`) finish in one dispatch turn and need no abort.
 *
 * The handshake reports the tier as `capabilities.cancelScope`:
 * - `'none'`    — no cancellation at all (reserved).
 * - `'queued'`  — a request cancelled before it starts is refused; a running op cannot be stopped.
 * - `'running'` — a running op can be aborted (this build).
 */
export const SERVE_CANCELLATION_SUPPORTED = true;

/** The cancel tier this build actually delivers. See {@link SERVE_CANCELLATION_SUPPORTED}. */
export const SERVE_CANCEL_SCOPE: 'none' | 'queued' | 'running' = SERVE_CANCELLATION_SUPPORTED
  ? 'running'
  : 'queued';
