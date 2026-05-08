import { describe, expect, it } from 'vitest';
import {
  loadCoreConfigFromPath,
  resolveCoreConfig,
  resolveCoreConfigLayers,
  tryLoadCoreConfigFromPath,
} from '../index.js';

describe('resolveCoreConfig', () => {
  it('resolves defaults via shared list window policy', () => {
    const cfg = resolveCoreConfig();
    expect(cfg.output.list.limit).toBe(200);
    expect(cfg.output.list.hardCap).toBe(10_000);
  });

  it('resolves explicit top and full', () => {
    const cfg = resolveCoreConfig({ output: { list: { top: 25, full: false } } });
    expect(cfg.output.list.limit).toBe(25);
    const full = resolveCoreConfig({ output: { list: { full: true } } });
    expect(full.output.list.limit).toBe(10_000);
  });

  it('supports maxCap override for list safety cap', () => {
    const cfg = resolveCoreConfig({ output: { list: { full: true, maxCap: 500 } } });
    expect(cfg.output.list.hardCap).toBe(500);
    expect(cfg.output.list.limit).toBe(500);
  });

  it('resolves scanner defaults with safety clamp', () => {
    const cfg = resolveCoreConfig();
    expect(cfg.scanner.mode).toBe('auto');
    expect(cfg.scanner.concurrency).toBe(16);
    expect(cfg.scanner.hardCap).toBe(32);
    expect(cfg.scanner.effectiveConcurrency).toBe(16);
  });

  it('applies scanner mode and clamp rules', () => {
    const concurrent = resolveCoreConfig({ scanner: { mode: 'concurrent', concurrency: 128, hardCap: 24 } });
    expect(concurrent.scanner.hardCap).toBe(24);
    expect(concurrent.scanner.concurrency).toBe(24);
    expect(concurrent.scanner.effectiveConcurrency).toBe(24);

    const serial = resolveCoreConfig({ scanner: { mode: 'serial', concurrency: 12 } });
    expect(serial.scanner.concurrency).toBe(12);
    expect(serial.scanner.effectiveConcurrency).toBe(1);
  });
});

describe('resolveCoreConfigLayers', () => {
  it('merges later layers over earlier', () => {
    const cfg = resolveCoreConfigLayers([
      { name: 'defaults', input: { output: { list: { top: 50 } } } },
      { name: 'override', input: { output: { list: { top: 10 } } } },
    ]);
    expect(cfg.output.list.limit).toBe(10);
  });
});

describe('loadCoreConfigFromPath', () => {
  it('loads JSON text via injected reader', async () => {
    const cfg = await loadCoreConfigFromPath({
      configPath: '/cfg.json',
      readText: () => JSON.stringify({ output: { list: { top: 17 } } }),
    });
    expect(cfg.output.list.limit).toBe(17);
  });

  it('returns failed Result on missing path', async () => {
    const res = await tryLoadCoreConfigFromPath({
      configPath: '/missing.json',
      readText: () => {
        const err = new Error('not found') as NodeJS.ErrnoException;
        err.code = 'ENOENT';
        throw err;
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues[0]?.code).toBe('i18nprune.config.missing');
      expect(res.issues[0]?.docPath).toBe('issues/config');
    }
  });
});
