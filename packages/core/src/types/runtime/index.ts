import type { ScanDebugEvent } from '../scanner/debug.js';

/** Global CLI run flags surfaced on `Context.run`. */
export type RunOptions = {
  json: boolean;
  /** Pretty-print JSON envelopes when `--json` is enabled. */
  jsonPretty: boolean;
  /** Less non-essential output. */
  quiet: boolean;
  /** Suppress informational and warning lines; still emit errors. */
  silent: boolean;
  /**
   * When true, the CLI registers {@link RunOptions.onScanDebug} to print scan skip events to stderr.
   * Hosts may set this for their own UX without wiring a sink.
   */
  debugScan: boolean;
  /** When true, the CLI may print report-cache dispatch/invalidation diagnostics. */
  debugCache: boolean;
  /**
   * When set and {@link RunOptions.silent} is false, the scanner invokes this for each skip
   * (directory walk skip, file excluded, non-source extension). Core never uses `console`;
   * the Node CLI assigns a listener that formats lines to stderr when `--debug-scan` is on
   * (the sink may still choose to suppress output when {@link RunOptions.quiet} is true).
   */
  onScanDebug?: (event: ScanDebugEvent) => void;
};
export type { RuntimeSystemPort } from './system.js';
export type { RuntimePathPort } from './path.js';
export type { RuntimeDirEntry, RuntimeFsPathKind, RuntimeFsPort, RuntimeReadFsPort } from './fs.js';
export type { CoreEngineRuntime } from './capabilities.js';
export type { RuntimeAdapters } from './adapters.js';
export type {
  ConfigPathSystemRuntime,
  ProjectFilesystemRuntime,
  RuntimeFsCap,
  RuntimeNetworkCap,
  RuntimePathCap,
  RuntimeSystemCap,
} from './capabilities.js';
export type { RuntimeNetworkPort } from './network.js';
export type { RuntimeKind } from './kind.js';
