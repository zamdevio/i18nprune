import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { listOtherLocaleCodes } from '@i18nprune/core';

describe('listOtherLocaleCodes', () => {
  const rt = createNodeRuntimeAdapters();

  it('lists non-source locale basenames', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-loc-'));
    try {
      fs.writeFileSync(path.join(dir, 'en.json'), '{}');
      fs.writeFileSync(path.join(dir, 'de.json'), '{}');
      expect(listOtherLocaleCodes(rt, dir, 'en').sort()).toEqual(['de']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns empty when dir missing', () => {
    expect(listOtherLocaleCodes(rt, path.join(os.tmpdir(), 'nope-' + String(Math.random())), 'en')).toEqual([]);
  });
});
