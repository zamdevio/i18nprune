import { afterEach, describe, expect, it } from 'vitest';
import { ENV_CI, ENV_I18NPRUNE_NO_UPDATE_CHECK } from '@/constants/env.js';
import { shouldSkipUpdateCheck } from '../skipPolicy.js';

describe('shouldSkipUpdateCheck', () => {
  const prevCi = process.env[ENV_CI];
  const prevOptOut = process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK];

  afterEach(() => {
    if (prevCi === undefined) delete process.env[ENV_CI];
    else process.env[ENV_CI] = prevCi;
    if (prevOptOut === undefined) delete process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK];
    else process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK] = prevOptOut;
  });

  it('returns false when env is unset', () => {
    delete process.env[ENV_CI];
    delete process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK];
    expect(shouldSkipUpdateCheck()).toBe(false);
  });

  it('skips when CI is truthy', () => {
    delete process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK];
    process.env[ENV_CI] = 'true';
    expect(shouldSkipUpdateCheck()).toBe(true);
  });

  it('skips when I18NPRUNE_NO_UPDATE_CHECK is truthy', () => {
    delete process.env[ENV_CI];
    process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK] = '1';
    expect(shouldSkipUpdateCheck()).toBe(true);
  });
});
