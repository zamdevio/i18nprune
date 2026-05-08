/**
 * How parallel file scanning is scheduled.
 * - **`auto`** — host picks serial vs concurrent.
 * - **`serial`** — single-threaded walk (predictable, slower on huge trees).
 * - **`concurrent`** — bounded worker pool up to **`concurrency`** / **`hardCap`**.
 */
export type ScannerExecutionMode = 'serial' | 'concurrent' | 'auto';

/** Optional tuning for source-tree scans (extractor / discovery). Safe defaults apply when omitted. */
export type ScannerConfigInput = {
  /**
   * Execution strategy hint.
   * - **`auto`**: runtime chooses strategy.
   * - **`serial`**: force single-worker execution.
   * - **`concurrent`**: allow multi-worker execution with limits.
   */
  mode?: ScannerExecutionMode;
  /**
   * Requested worker count when mode is **`concurrent`** (or **`auto`** if runtime supports it).
   * Clamped to **`[1, hardCap]`** by core resolver.
   */
  concurrency?: number;
  /**
   * Safety ceiling for worker count. Core clamps this to at least 1.
   * Hosts may still apply stricter runtime-specific ceilings.
   */
  hardCap?: number;
};

export type ScannerConfigResolved = {
  mode: ScannerExecutionMode;
  concurrency: number;
  hardCap: number;
  effectiveConcurrency: number;
};

export type ResolveScannerConfigOptions = {
  defaultMode?: ScannerExecutionMode;
  defaultConcurrency?: number;
  defaultHardCap?: number;
};
