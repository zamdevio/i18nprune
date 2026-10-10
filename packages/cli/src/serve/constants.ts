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
];

/** Op methods that mutate disk. Reserved for the S.4 write slice (gated by `--allow-writes`). */
export const SERVE_WRITE_OPS: ReadonlySet<string> = new Set<string>();
