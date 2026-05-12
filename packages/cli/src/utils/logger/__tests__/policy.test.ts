import { describe, expect, it } from 'vitest';
import { canPrintScanDebug } from '@/utils/logger/policy.js';
import type { RunOptions } from '@i18nprune/core';

function base(): RunOptions {
  return {
    json: false,
    jsonPretty: false,
    quiet: false,
    silent: false,
    debugScan: true,
  };
}

describe('canPrintScanDebug', () => {
  it('is off under --quiet (like info)', () => {
    expect(canPrintScanDebug({ ...base(), quiet: true })).toBe(false);
  });

  it('is off under --silent and --json', () => {
    expect(canPrintScanDebug({ ...base(), silent: true })).toBe(false);
    expect(canPrintScanDebug({ ...base(), json: true })).toBe(false);
  });

  it('is on in default human mode', () => {
    expect(canPrintScanDebug(base())).toBe(true);
  });
});
