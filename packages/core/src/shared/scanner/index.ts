import type { ProjectFilesystemRuntime } from '../../types/runtime/capabilities.js';
import type { ListSourceFilesOptions } from '../../types/scanner/debug.js';
import type { ScanExcludeConfig } from '../../types/scanner/exclude.js';
import { readRuntimeFsTextSync } from '../../runtime/helpers/sync/index.js';
import { listSourceFiles } from './files.js';
import type { SourceScanResult } from '../../types/scanner/index.js';

/** Read concatenated source text from all scanned files under `srcRoot`. */
export function scanSources(
  runtime: ProjectFilesystemRuntime,
  srcRoot: string,
  exclude?: ScanExcludeConfig,
  scanOpts?: ListSourceFilesOptions,
): SourceScanResult {
  const files = listSourceFiles(runtime, srcRoot, exclude, scanOpts);
  const parts: string[] = [];
  for (const f of files) {
    try {
      parts.push(readRuntimeFsTextSync(f, runtime.fs));
    } catch {
      /* skip */
    }
  }
  return { files, text: parts.join('\n') };
}
