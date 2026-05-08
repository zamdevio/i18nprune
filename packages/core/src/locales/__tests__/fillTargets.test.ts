import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import { resolveFillAllTargetCodes, resolveFillTargetCodesFromRaw } from '../fillTargets.js';

describe('fill target resolution', () => {
  const rt = createNodeRuntimeAdapters();

  it('resolveFillAllTargetCodes returns normalized non-source codes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-fill-tg-'));
    try {
      fs.writeFileSync(path.join(dir, 'en.json'), '{}');
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      expect(resolveFillAllTargetCodes(rt, dir, 'en', 'fill').sort()).toEqual(['fr']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('resolveFillTargetCodesFromRaw handles single code', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-fill-tg2-'));
    try {
      const source = path.join(dir, 'en.json');
      fs.writeFileSync(source, '{}');
      fs.writeFileSync(path.join(dir, 'ja.json'), '{}');
      expect(
        resolveFillTargetCodesFromRaw({
          commandName: 'fill',
          raw: 'ja',
          localesDir: dir,
          sourceLocalePath: source,
          runtime: rt,
        }),
      ).toEqual(['ja']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('resolveFillTargetCodesFromRaw rejects unknown catalog code', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-fill-tg3-'));
    try {
      const source = path.join(dir, 'en.json');
      fs.writeFileSync(source, '{}');
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      expect(() =>
        resolveFillTargetCodesFromRaw({
          commandName: 'fill',
          raw: 'not-a-real-locale-code-xyz',
          localesDir: dir,
          sourceLocalePath: source,
          runtime: rt,
        }),
      ).toThrow(I18nPruneError);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
