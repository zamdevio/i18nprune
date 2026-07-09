import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import type { ResolvedPatchingConfig } from '../../types/patching/index.js';
import { computeGeneratedModuleImportBase, toEsmRelativeImportPath } from '../io.js';

describe('toEsmRelativeImportPath', () => {
  it('prefixes bare segments with ./', () => {
    expect(toEsmRelativeImportPath('locales')).toBe('./locales');
    expect(toEsmRelativeImportPath('locales/en.json')).toBe('./locales/en.json');
  });

  it('preserves existing ./ and ../ prefixes', () => {
    expect(toEsmRelativeImportPath('./locales')).toBe('./locales');
    expect(toEsmRelativeImportPath('../locales')).toBe('../locales');
  });

  it('normalizes empty relative to ./', () => {
    expect(toEsmRelativeImportPath('')).toBe('./');
    expect(toEsmRelativeImportPath('.')).toBe('./');
  });
});

describe('computeGeneratedModuleImportBase', () => {
  const rt = createNodeRuntimeAdapters();

  it('emits ./-prefixed import base for sibling locales dir (ShareVault shape)', () => {
    const config: ResolvedPatchingConfig = {
      enabled: true,
      recipe: 'loader_generated',
      loaderPath: 'src/i18n/loaders.generated.ts',
      configPath: 'src/i18n/config.json',
      localeJsonImportBase: 'src/i18n/locales',
    };
    const importBase = computeGeneratedModuleImportBase(rt, config, '/project');
    expect(importBase).toBe('./locales');
  });

  it('emits ../ when loader is nested under generated/', () => {
    const config: ResolvedPatchingConfig = {
      enabled: true,
      recipe: 'loader_generated',
      loaderPath: 'src/i18n/generated/loaders.ts',
      configPath: 'src/i18n/config.json',
      localeJsonImportBase: 'src/i18n/locales',
    };
    const importBase = computeGeneratedModuleImportBase(rt, config, '/project');
    expect(importBase).toBe('../locales');
  });
});
