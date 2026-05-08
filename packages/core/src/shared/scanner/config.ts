import type {
  ResolveScannerConfigOptions,
  ScannerConfigInput,
  ScannerConfigResolved,
} from '../../types/scanner/config.js';

export const SCANNER_DEFAULT_MODE: ScannerConfigResolved['mode'] = 'auto';
export const SCANNER_DEFAULT_CONCURRENCY = 16;
export const SCANNER_DEFAULT_HARD_CAP = 32;

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const n = Math.trunc(value);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function resolveScannerConfig(
  input?: ScannerConfigInput,
  options?: ResolveScannerConfigOptions,
): ScannerConfigResolved {
  const hardCap = clampInt(input?.hardCap ?? options?.defaultHardCap ?? SCANNER_DEFAULT_HARD_CAP, 1, 4096);
  const mode = input?.mode ?? options?.defaultMode ?? SCANNER_DEFAULT_MODE;
  const requested = clampInt(
    input?.concurrency ?? options?.defaultConcurrency ?? SCANNER_DEFAULT_CONCURRENCY,
    1,
    hardCap,
  );
  const effectiveConcurrency = mode === 'serial' ? 1 : requested;
  return {
    mode,
    concurrency: requested,
    hardCap,
    effectiveConcurrency,
  };
}
