import { describe, expect, it } from 'vitest';
import { canPrintCache, canPrintScanDebug } from '@/utils/logger/policy.js';
import type { RunOptions } from '@i18nprune/core';

function base(): RunOptions {
  return {
    json: false,
    jsonPretty: false,
    quiet: false,
    silent: false,
    debugScan: true,
    debugCache: false,
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

describe('canPrintCache', () => {
  it('requires --debug-cache', () => {
    expect(canPrintCache(base())).toBe(false);
    expect(canPrintCache({ ...base(), debugCache: true })).toBe(true);
  });

  it('is hidden by normal info gates', () => {
    expect(canPrintCache({ ...base(), debugCache: true, quiet: true })).toBe(false);
    expect(canPrintCache({ ...base(), debugCache: true, silent: true })).toBe(false);
    expect(canPrintCache({ ...base(), debugCache: true, json: true })).toBe(false);
  });
});
