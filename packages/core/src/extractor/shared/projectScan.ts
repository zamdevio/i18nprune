import { I18nPruneError } from '../../shared/errors/index.js';
import { listSourceFiles } from '../../shared/scanner/files.js';
import { readRuntimeFsTextSync } from '../../runtime/helpers/sync/index.js';
import type { ScanProjectSourceFilesInput } from '../../types/extractor/shared/index.js';

/**
 * Resolves list/read/cwd for `scanProjectSourceFiles`.
 * Default branch requires **`runtime`** with **`system`** (`CoreEngineRuntime`: `fs` + `path` + `system`) so
 * `system.cwd()` can drive display paths — not a `ProjectFilesystemRuntime`-only slice.
 */
function resolveScanIo<T>(input: ScanProjectSourceFilesInput<T>): {
  cwd: string;
  listFiles: (srcRoot: string) => string[];
  readFile: (filePath: string) => string;
  pathPort: NonNullable<ScanProjectSourceFilesInput<T>['runtime']>['path'] | NonNullable<
    ScanProjectSourceFilesInput<T>['path']
  >;
} {
  const { readFile, listFiles, runtime, path: pathOverride } = input;
  const pathPort = runtime?.path ?? pathOverride;
  if (readFile && listFiles) {
    if (!pathPort) {
      throw new I18nPruneError(
        'scanProjectSourceFiles: with custom `readFile`/`listFiles`, pass `runtime` or `path` for display paths.',
        'USAGE',
      );
    }
    if (input.cwd !== undefined) {
      return { cwd: input.cwd, listFiles, readFile, pathPort };
    }
    if (runtime) {
      return { cwd: input.cwd ?? runtime.system.cwd(), listFiles, readFile, pathPort };
    }
    throw new I18nPruneError(
      'scanProjectSourceFiles: when using custom `readFile` and `listFiles`, set `cwd` or pass `runtime` for `system.cwd()`.',
      'USAGE',
    );
  }
  if (readFile || listFiles) {
    throw new I18nPruneError(
      'scanProjectSourceFiles: provide both `readFile` and `listFiles`, or omit both and pass `runtime`.',
      'USAGE',
    );
  }
  if (!runtime) {
    throw new I18nPruneError(
      'scanProjectSourceFiles: pass `runtime` ({ fs, path, system }) or both `readFile` and `listFiles`.',
      'USAGE',
    );
  }
  const cwd = input.cwd ?? runtime.system.cwd();
  return {
    cwd,
    listFiles: (srcRoot) =>
      listSourceFiles(runtime, srcRoot, input.exclude, input.scanDebug ? { onScanDebug: input.scanDebug } : undefined),
    readFile: (filePath) => readRuntimeFsTextSync(filePath, runtime.fs),
    pathPort: runtime.path,
  };
}

/**
 * Shared extractor orchestration helper for project-wide file scans.
 * Keeps filesystem walking + path normalization in one place.
 */
export function scanProjectSourceFiles<T>(input: ScanProjectSourceFilesInput<T>): T[] {
  const { cwd, listFiles, readFile, pathPort } = resolveScanIo(input);
  const files = listFiles(input.srcRoot);
  const out: T[] = [];

  for (const filePath of files) {
    let text: string;
    try {
      text = readFile(filePath);
    } catch {
      continue;
    }
    const relFromSrc = pathPort.relative(input.srcRoot, filePath).replace(/\\/g, '/');
    const displayPath =
      relFromSrc && !relFromSrc.startsWith('..')
        ? relFromSrc
        : (() => {
            const relCwd = pathPort.relative(cwd, filePath);
            return relCwd && !relCwd.startsWith('..') ? relCwd.replace(/\\/g, '/') : filePath;
          })();
    const rows = input.scanFile({ filePath, displayPath, text });
    out.push(...rows);
  }

  return out;
}
