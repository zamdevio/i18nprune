import {
  SERVE_API_VERSION,
  SERVE_CANCELLATION_SUPPORTED,
  SERVE_IMPLEMENTED_OPS,
  SERVE_PROGRESS_OPS,
  SERVE_PROTOCOL_VERSION,
} from '@/constants/serve.js';
import { CLI_NAME, CLI_VERSION } from '@/constants/cli.js';
import type { ServeRootConfig } from './roots.js';

/**
 * Handshake result. The client feature-detects against `capabilities` and picks behaviour from
 * `rootMode`; `protocolVersion` is what it must validate and fail closed on.
 */
export type ServeInitializeResult = {
  readonly protocolVersion: string;
  readonly serverInfo: { readonly name: string; readonly version: string; readonly node: string };
  readonly apiVersion: string;
  readonly rootMode: 'sandbox' | 'hub';
  readonly projectRoot: string | null;
  readonly capabilities: {
    readonly ops: readonly string[];
    /** True when op methods that emit `run.*` events stream `$/progress` (see `progressOps`). */
    readonly progress: boolean;
    /** Op methods that stream `$/progress`. Empty when none do. */
    readonly progressOps: readonly string[];
    /** True when this build can abort a running op. `false` until core accepts an `AbortSignal`. */
    readonly cancel: boolean;
    readonly writes: boolean;
  };
};

/**
 * Build the `initialize` payload from the session's configuration.
 *
 * `ops` reports only methods this build actually implements ({@link SERVE_IMPLEMENTED_OPS}); a client
 * must never see a capability the server cannot honour. `progress` is true when any op streams
 * `$/progress` (listed in `progressOps`); `cancel` stays false until core can interrupt a running op
 * ({@link SERVE_CANCELLATION_SUPPORTED}); `writes` reflects `--allow-writes`.
 */
export function buildInitializeResult(
  cfg: ServeRootConfig,
  opts: { readonly writes: boolean },
): ServeInitializeResult {
  const progressOps = [...SERVE_PROGRESS_OPS];
  return {
    protocolVersion: SERVE_PROTOCOL_VERSION,
    serverInfo: { name: CLI_NAME, version: CLI_VERSION, node: process.version },
    apiVersion: SERVE_API_VERSION,
    rootMode: cfg.mode,
    projectRoot: cfg.mode === 'sandbox' ? cfg.root : null,
    capabilities: {
      ops: SERVE_IMPLEMENTED_OPS,
      progress: progressOps.length > 0,
      progressOps,
      cancel: SERVE_CANCELLATION_SUPPORTED,
      writes: opts.writes,
    },
  };
}
