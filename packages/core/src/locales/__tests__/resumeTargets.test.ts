import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import { resolveResumeAllTargetCodes, resolveResumeTargetCodesFromRaw } from '../resumeTargets.js';

describe('generate --resume target resolution', () => {
  const rt = createNodeRuntimeAdapters();

  it('resolveResumeAllTargetCodes returns normalized non-source codes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-tg-'));
    try {
      fs.writeFileSync(path.join(dir, 'en.json'), '{}');
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      expect(resolveResumeAllTargetCodes(rt, dir, 'en', 'generate').sort()).toEqual(['fr']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('resolveResumeTargetCodesFromRaw handles single code', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-tg2-'));
    try {
      const source = path.join(dir, 'en.json');
      fs.writeFileSync(source, '{}');
      fs.writeFileSync(path.join(dir, 'ja.json'), '{}');
      expect(
        resolveResumeTargetCodesFromRaw({
          commandName: 'generate',
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

  it('resolveResumeTargetCodesFromRaw rejects unknown catalog code', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-tg3-'));
    try {
      const source = path.join(dir, 'en.json');
      fs.writeFileSync(source, '{}');
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      expect(() =>
        resolveResumeTargetCodesFromRaw({
          commandName: 'generate',
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
