import { SERVE_API_VERSION, SERVE_IMPLEMENTED_OPS, SERVE_PROTOCOL_VERSION } from '@/constants/serve.js';
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
    readonly progress: boolean;
    readonly cancel: boolean;
    readonly writes: boolean;
  };
};

/**
 * Build the `initialize` payload from the session's configuration.
 *
 * `ops` reports only methods this build actually implements ({@link SERVE_IMPLEMENTED_OPS}); a client
 * must never see a capability the server cannot honour. `writes` reflects `--allow-writes`, `cancel`
 * and `progress` gate the S.3 slice.
 */
export function buildInitializeResult(
  cfg: ServeRootConfig,
  opts: { readonly writes: boolean },
): ServeInitializeResult {
  return {
    protocolVersion: SERVE_PROTOCOL_VERSION,
    serverInfo: { name: CLI_NAME, version: CLI_VERSION, node: process.version },
    apiVersion: SERVE_API_VERSION,
    rootMode: cfg.mode,
    projectRoot: cfg.mode === 'sandbox' ? cfg.root : null,
    capabilities: {
      ops: SERVE_IMPLEMENTED_OPS,
      progress: false,
      cancel: false,
      writes: opts.writes,
    },
  };
}
