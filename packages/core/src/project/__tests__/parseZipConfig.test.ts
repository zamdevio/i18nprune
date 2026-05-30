import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { tryParseConfigObjectFromTsOrJs } from '../parseConfigScript.js';
import { parseZipToSnapshot } from '../parseZip.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../../../tests/fixtures');

describe('parseZipToSnapshot config detection', () => {
  it('parses locales.mode and locales.structure from i18nprune.config.ts', () => {
    const zip = zipSync({
      'i18nprune.config.ts': strToU8(`
        export default {
          locales: {
            source: 'en',
            directory: 'messages',
            mode: 'locale_directory',
            structure: 'locale_per_dir',
          },
          src: 'src',
          functions: ['t'],
        };
      `),
      'src/app.ts': strToU8('const x = t("a");'),
      'messages/en/common.json': strToU8('{"a":"A"}'),
    });
    const parsed = parseZipToSnapshot('pid', 'hash', zip);
    const locales = parsed.snapshot.resolvedConfig?.locales as Record<string, unknown>;
    expect(locales.mode).toBe('locale_directory');
    expect(locales.structure).toBe('locale_per_dir');
  });

  it('parses layout fixture configs for CLI share snapshot shell', () => {
    const perDir = tryParseConfigObjectFromTsOrJs(
      readFileSync(path.join(fixtureRoot, 'layout-locale-per-dir/i18nprune.config.mjs'), 'utf8'),
    );
    expect(perDir?.locales).toMatchObject({
      mode: 'locale_directory',
      structure: 'locale_per_dir',
    });

    const feature = tryParseConfigObjectFromTsOrJs(
      readFileSync(path.join(fixtureRoot, 'layout-feature-bundle/i18nprune.config.mjs'), 'utf8'),
    );
    expect(feature?.locales).toMatchObject({
      mode: 'locale_directory',
      structure: 'feature_bundle',
    });
  });
});
