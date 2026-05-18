import { describe, expect, it } from 'vitest';
import { resolveCacheConfig, resolveCacheRebuildConfig } from '../resolveConfig.js';

describe('resolveCacheConfig', () => {
  it('uses balanced profile by default', () => {
    const r = resolveCacheConfig({});
    expect(r.profile).toBe('balanced');
    expect(r.rebuild).toBe('partial');
    expect(r.fullRescanThresholdPercent).toBe(40);
    expect(r.mode).toBe('readWrite');
  });

  it('expands safe and fast profiles', () => {
    expect(resolveCacheConfig({ profile: 'safe' }).rebuild).toBe('full');
    expect(resolveCacheConfig({ profile: 'safe' }).fullRescanThresholdPercent).toBe(10);
    expect(resolveCacheConfig({ profile: 'fast' }).fullRescanThresholdPercent).toBe(70);
  });

  it('lets explicit fields override profile values', () => {
    const r = resolveCacheConfig({
      profile: 'safe',
      rebuild: 'partial',
      fullRescanThresholdPercent: 55,
      mode: 'readOnly',
    });
    expect(r.rebuild).toBe('partial');
    expect(r.fullRescanThresholdPercent).toBe(55);
    expect(r.mode).toBe('readOnly');
  });

  it('resolveCacheRebuildConfig matches rebuild slice', () => {
    const full = resolveCacheConfig({ profile: 'fast', rebuild: 'full' });
    const slice = resolveCacheRebuildConfig({ profile: 'fast', rebuild: 'full' });
    expect(slice.rebuild).toBe(full.rebuild);
    expect(slice.fullRescanThresholdPercent).toBe(full.fullRescanThresholdPercent);
  });
});
