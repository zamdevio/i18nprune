import { describe, expect, it } from 'vitest';
import {
  assessPatchingConfigInjection,
  buildPatchingSnippet,
  tryInjectPatchingConfig,
} from '@/shared/patching/injectConfigBlock.js';

const SNIPPET = buildPatchingSnippet(
  {
    relative: () => 'src/i18n/config.json',
    dirname: () => '.',
    isAbsolute: () => false,
  } as never,
  {
    configPath: '/proj/src/i18n/config.json',
    loaderPath: '/proj/src/i18n/loaders.generated.ts',
    localeJsonImportBase: 'messages',
  },
  '/proj',
);

describe('tryInjectPatchingConfig', () => {
  it('injects after export default defineConfig({', () => {
    const file = `import { defineConfig } from 'i18nprune';\nexport default defineConfig({\n  locales: {},\n});\n`;
    const out = tryInjectPatchingConfig(file, SNIPPET);
    expect(out.kind).toBe('updated');
    expect(out.text).toContain('patching: {');
    expect(out.text.indexOf('patching: {')).toBeLessThan(out.text.indexOf('locales:'));
  });

  it('injects after export default { (mjs)', () => {
    const file = `export default {\n  locales: {},\n};\n`;
    const out = tryInjectPatchingConfig(file, SNIPPET);
    expect(out.kind).toBe('updated');
    expect(out.text).toMatch(/export default \{\n\s*patching: \{/);
  });

  it('injects after module.exports = { (cjs)', () => {
    const file = `module.exports = {\n  locales: {},\n};\n`;
    const out = tryInjectPatchingConfig(file, SNIPPET);
    expect(out.kind).toBe('updated');
    expect(out.text).toContain('patching: {');
  });

  it('skips when patching block already exists', () => {
    const file = `export default {\n  patching: {},\n};\n`;
    const out = tryInjectPatchingConfig(file, SNIPPET);
    expect(out.kind).toBe('skipped_existing');
  });

  it('skips when multiple config object openers are present', () => {
    const file = `export default defineConfig({ a: 1 });\nexport default { b: 2 };\n`;
    const out = tryInjectPatchingConfig(file, SNIPPET);
    expect(out.kind).toBe('skipped_unsure');
    expect(assessPatchingConfigInjection(file).safe).toBe(false);
  });
});
