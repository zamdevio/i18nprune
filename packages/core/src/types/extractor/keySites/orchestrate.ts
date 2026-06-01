import type { ScanProjectFilesystemInputBase } from '../projectScanInput.js';

export type ScanProjectKeyObservationsInput = ScanProjectFilesystemInputBase & {
  functions: string[];
};
