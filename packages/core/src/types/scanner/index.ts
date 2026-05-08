export type SourceScanResult = {
  files: string[];
  text: string;
};

export type {
  ResolveScannerConfigOptions,
  ScannerConfigInput,
  ScannerConfigResolved,
  ScannerExecutionMode,
} from './config.js';
export type { ScanExcludeConfig, ScanExcludePreset, ScanExcludeRule } from './exclude.js';
export type {
  ListSourceFilesOptions,
  ScanDebugEvent,
  ScanDebugSkipDirectoryEvent,
  ScanDebugSkipFileEvent,
} from './debug.js';
export type { CompiledScanExclude } from './compile.js';
