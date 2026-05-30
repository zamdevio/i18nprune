import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import { resolveResumeAllTargetCodes, resolveResumeTargetCodesFromRaw } from '../resumeTargets.js';

function flatFileCtx(root: string, dir: string, sourceCode = 'en', sourceFile = 'en.json') {
  const nodeAdapters = createNodeRuntimeAdapters();
  const adapters = {
    ...nodeAdapters,
    system: { ...nodeAdapters.system, cwd: () => root },
  };
  const config = parseI18nPruneConfig({
    ...DEFAULT_CONFIG,
    locales: { source: sourceCode, directory: path.basename(dir) },
    src: 'src',
    functions: ['t'],
  });
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  return createCoreContext({
    config,
    adapters,
    env: {},
    paths: {
      sourceLocale: path.join(dir, sourceFile),
      localesDir: dir,
      srcRoot: path.join(root, 'src'),
    },
  });
}

describe('generate --resume target resolution', () => {
  it('resolveResumeAllTargetCodes returns normalized non-source codes (flat_file)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-tg-'));
    try {
      const dir = path.join(root, 'locales');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'en.json'), '{}');
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      const ctx = flatFileCtx(root, dir);
      expect(resolveResumeAllTargetCodes(ctx, 'generate').sort()).toEqual(['fr']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolveResumeAllTargetCodes finds targets in feature_bundle layout', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-fb-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'auth'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), '{}');
      fs.writeFileSync(path.join(messages, 'app', 'fr.json'), '{}');
      fs.writeFileSync(path.join(messages, 'auth', 'en.json'), '{}');
      fs.writeFileSync(path.join(messages, 'auth', 'fr.json'), '{}');
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const nodeAdapters = createNodeRuntimeAdapters();
      const adapters = {
        ...nodeAdapters,
        system: { ...nodeAdapters.system, cwd: () => root },
      };
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
        },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });
      expect(resolveResumeAllTargetCodes(ctx, 'generate')).toEqual(['fr']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolveResumeTargetCodesFromRaw handles single code', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-tg2-'));
    try {
      const dir = path.join(root, 'locales');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'en.json'), '{}');
      fs.writeFileSync(path.join(dir, 'ja.json'), '{}');
      const ctx = flatFileCtx(root, dir);
      expect(
        resolveResumeTargetCodesFromRaw({
          commandName: 'generate',
          raw: 'ja',
          ctx,
        }),
      ).toEqual(['ja']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolveResumeTargetCodesFromRaw rejects unknown catalog code', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-resume-tg3-'));
    try {
      const dir = path.join(root, 'locales');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'en.json'), '{}');
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      const ctx = flatFileCtx(root, dir);
      expect(() =>
        resolveResumeTargetCodesFromRaw({
          commandName: 'generate',
          raw: 'not-a-real-locale-code-xyz',
          ctx,
        }),
      ).toThrow(I18nPruneError);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
