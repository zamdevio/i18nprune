import type { CoreEngineRuntime } from '../../runtime/capabilities.js';
import type { RuntimePathPort } from '../../runtime/path.js';
import type { ScanExcludeConfig } from '../../scanner/exclude.js';
import type { ListSourceFilesOptions } from '../../scanner/debug.js';

export type ScanProjectFileInput = {
  filePath: string;
  displayPath: string;
  text: string;
};

export type ScanProjectSourceFilesInput<T> = {
  srcRoot: string;
  /** Optional scan exclusions (dirs while walking, files, extensions, path patterns). */
  exclude?: ScanExcludeConfig;
  /** Optional scan debug sink (same contract as {@link listSourceFiles} fourth argument). */
  scanDebug?: ListSourceFilesOptions['onScanDebug'];
  cwd?: string;
  /**
   * When `readFile` / `listFiles` are omitted, **`runtime`** supplies defaults (host `fs` + `path` + `system.cwd()`).
   * Type is {@link CoreEngineRuntime} (includes `system`), not only {@link ProjectFilesystemRuntime}.
   * When both **`readFile`** and **`listFiles`** are set, also pass **`path`** (or **`runtime`**) so display paths can use `path.relative`.
   */
  runtime?: CoreEngineRuntime;
  /** Used for `relative` when injecting `readFile`/`listFiles` without a full `runtime`. */
  path?: RuntimePathPort;
  readFile?: (filePath: string) => string;
  listFiles?: (srcRoot: string) => string[];
  scanFile: (input: ScanProjectFileInput) => readonly T[];
};
