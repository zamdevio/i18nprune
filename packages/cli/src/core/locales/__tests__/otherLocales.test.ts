import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { listOtherLocaleCodes } from '@/core/locales/otherLocales.js';

describe('listOtherLocaleCodes', () => {
  it('returns non-source basenames, skips meta', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-loc-'));
    fs.writeFileSync(path.join(dir, 'en.json'), '{}');
    fs.writeFileSync(path.join(dir, 'de.json'), '{}');
    fs.writeFileSync(path.join(dir, 'de.meta.json'), '{}');
    expect(listOtherLocaleCodes(dir, 'en').sort()).toEqual(['de']);
  });

  it('returns empty when dir missing', () => {
    expect(listOtherLocaleCodes(path.join(os.tmpdir(), 'nope-' + String(Math.random())), 'en')).toEqual([]);
  });
});
