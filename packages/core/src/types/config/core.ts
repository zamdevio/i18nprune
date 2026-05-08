import type { ListWindowResolved, ResolveListWindowOptions } from '../../shared/options/index.js';
import type { ResolveScannerConfigOptions, ScannerConfigInput, ScannerConfigResolved } from '../scanner/config.js';

export type OutputListConfigInput = {
  top?: number;
  full?: boolean;
  /** Optional override for the hard safety cap (still validated/clamped in core). */
  maxCap?: number;
};

export type CoreConfigInput = {
  output?: {
    list?: OutputListConfigInput;
  };
  scanner?: ScannerConfigInput;
};

export type CoreConfigResolved = {
  output: {
    list: ListWindowResolved;
  };
  scanner: ScannerConfigResolved;
};

export type ResolveCoreConfigOptions = {
  listWindow?: ResolveListWindowOptions;
  scanner?: ResolveScannerConfigOptions;
};
