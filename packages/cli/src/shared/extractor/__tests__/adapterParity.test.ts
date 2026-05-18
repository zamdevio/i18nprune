import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { buildKeyReferenceContext as buildKeyReferenceContextCore, extractor } from '@i18nprune/core';
import { scanProjectDynamicKeySites as scanProjectDynamicKeySitesAdapter } from '@/shared/extractor/index.js';
import {
  scanProjectKeyObservations as scanProjectKeyObservationsAdapter,
  scanProjectLiteralKeyUsage as scanProjectLiteralKeyUsageAdapter,
} from '@/shared/extractor/index.js';
import { buildKeyReferenceContext } from '@/shared/reference/index.js';
import { resolveReferenceConfig } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/index.js';
import type { Context } from '@/types/core/context/index.js';

function fixtureContext(): Context {
  const cwd = process.cwd();
  return {
    paths: {
      srcRoot: path.join(cwd, 'tests/fixtures/sample-i18n/src'),
      sourceLocale: path.join(cwd, 'tests/fixtures/sample-i18n/locales/en.json'),
      localesDir: path.join(cwd, 'tests/fixtures/sample-i18n/locales'),
    },
    config: {
      locales: {
        source: './locales/en.json',
        directory: './locales',
      },
      src: './src',
      functions: ['t'],
      reference: {},
    },
    run: { json: false, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false },
    meta: {
      warnings: [],
      fieldSources: {},
      configFileLoaded: true,
      cache: {
        enabled: false,
        reason: 'default',
        rootDir: '',
        metaPath: '',
        projectId: '',
        projectRoot: cwd,
        projectDir: '',
        filesPath: '',
        analysisPath: '',
        readOnly: false,
      },
    },
    adapters: createNodeRuntimeAdapters(),
  };
}

describe('extractor adapter parity', () => {
  it('keySites adapter matches direct core orchestrator output', () => {
    const ctx = fixtureContext();
    const scan = toExtractorScanInput(ctx);
    const viaAdapter = scanProjectKeyObservationsAdapter(ctx);
    const viaCore = extractor.keySites.scanProjectKeyObservations(scan);
    expect(viaAdapter).toEqual(viaCore);
  });

  it('dynamic adapter matches direct core orchestrator output', () => {
    const ctx = fixtureContext();
    const scan = toExtractorScanInput(ctx);
    const viaAdapter = scanProjectDynamicKeySitesAdapter(ctx);
    const viaCore = extractor.dynamic.scanProjectDynamicKeySites(scan);
    expect(viaAdapter).toEqual(viaCore);
  });

  it('literal key usage adapter matches direct core orchestrator output', () => {
    const ctx = fixtureContext();
    const viaAdapter = scanProjectLiteralKeyUsageAdapter(ctx);
    const viaCore = extractor.keySites.scanProjectLiteralKeyUsage(toExtractorScanInput(ctx));
    expect(viaAdapter).toEqual(viaCore);
  });

  it('reference context matches usage + dynamic composition', () => {
    const ctx = fixtureContext();
    const eff = resolveReferenceConfig('cleanup', ctx.config);
    const reference = buildKeyReferenceContext(ctx, eff);
    const viaCore = buildKeyReferenceContextCore(toExtractorScanInput(ctx), eff);
    expect([...reference.provenKeys].sort()).toEqual([...viaCore.provenKeys].sort());
    expect([...reference.uncertainPrefixes].sort()).toEqual([...viaCore.uncertainPrefixes].sort());
  });
});
