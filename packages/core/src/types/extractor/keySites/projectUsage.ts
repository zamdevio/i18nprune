import type { ScanProjectFilesystemInputBase } from '../projectScanInput.js';

export type ScanProjectLiteralKeyUsageInput = ScanProjectFilesystemInputBase & {
  functions: string[];
};
