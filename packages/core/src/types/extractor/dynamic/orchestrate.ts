import type { ScanProjectFilesystemInputBase } from '../projectScanInput.js';

export type ScanProjectDynamicKeySitesInput = ScanProjectFilesystemInputBase & {
  functions: string[];
};
