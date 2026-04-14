import { describe, expect, it } from 'vitest';
import * as core from '@/exports/core.js';

describe('@zamdevio/i18nprune/core namespaces', () => {
  it('exposes grouped namespaces with the same callables as flat exports', () => {
    expect(core.context.resolveContext).toBe(core.resolveContext);
    expect(core.context.clearContextCache).toBe(core.clearContextCache);
    expect(core.extractor.scanProjectLiteralKeyUsage).toBe(core.scanProjectLiteralKeyUsage);
    expect(core.dynamic.scanProjectDynamicKeySites).toBe(core.scanProjectDynamicKeySites);
    expect(core.json.collectStringLeaves).toBe(core.collectStringLeaves);
    expect(core.files.readJsonFile).toBe(core.readJsonFile);
    expect(core.validate.computeMissingLiteralKeys).toBe(core.computeMissingLiteralKeys);
    expect(core.result.stringifyCliCommandJson).toBe(core.stringifyCliCommandJson);
    expect(core.RESULT_API_VERSION).toBe(core.result.RESULT_API_VERSION);
    expect(core.programmatic.tryResolveContext).toBe(core.tryResolveContext);
    expect(core.programmatic.runValidate).toBe(core.runValidate);
    expect(core.programmatic.stringifyEnvelope).toBe(core.stringifyEnvelope);
    expect(core.programmatic.runGenerate).toBe(core.runGenerate);
    expect(core.programmatic.runReport).toBe(core.runReport);
  });
});
