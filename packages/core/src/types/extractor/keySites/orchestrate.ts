import type { ScanProjectFilesystemInputBase } from '../projectScanInput.js';
import type { ExtractorHocOptions } from '../hoc/index.js';

export type ScanProjectKeyObservationsInput = ScanProjectFilesystemInputBase & {
  functions: string[];
  /** Opt-in HOC §B prop-helper expansion. */
  hoc?: ExtractorHocOptions;
};
