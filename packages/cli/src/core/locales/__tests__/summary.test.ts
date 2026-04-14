import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLocaleListRows } from '@/core/locales/summary.js';

describe('buildLocaleListRows', () => {
  it('builds per-locale leaf counts and source-identical counts', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-locale-summary-'));
    const sourcePath = path.join(dir, 'en.json');
    fs.writeFileSync(sourcePath, JSON.stringify({ home: { title: 'Home', cta: 'Start' } }), 'utf8');
    fs.writeFileSync(
      path.join(dir, 'fr.json'),
      JSON.stringify({ home: { title: 'Accueil', cta: 'Start' } }),
      'utf8',
    );

    const rows = buildLocaleListRows(dir, ['fr.json', 'en.json'], sourcePath);
    expect(rows.map((row) => row.code)).toEqual(['en', 'fr']);
    expect(rows[0]).toMatchObject({
      code: 'en',
      leafCount: 2,
      englishIdenticalLeafCount: null,
      isSourceLocale: true,
    });
    expect(rows[1]).toMatchObject({
      code: 'fr',
      leafCount: 2,
      englishIdenticalLeafCount: 1,
      isSourceLocale: false,
    });
  });
});
