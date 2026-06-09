import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { buildLocaleSuggestions } from '../build.js';
import { computeExtraTargetKeys } from '../computeExtraTargetKeys.js';
import { computeUnusedSourceKeys } from '../computeUnusedSourceKeys.js';
import { formatLocaleSuggestionHuman } from '../format.js';
import type { ProjectAnalysis } from '../../types/analysis/index.js';

function flatCtx(root: string, localeJson: Record<string, unknown>, srcFiles: Record<string, string>) {
  const localesDir = path.join(root, 'locales');
  const srcRoot = path.join(root, 'src');
  fs.mkdirSync(localesDir, { recursive: true });
  fs.mkdirSync(srcRoot, { recursive: true });
  const sourcePath = path.join(localesDir, 'en.json');
  fs.writeFileSync(sourcePath, JSON.stringify(localeJson));
  for (const [rel, body] of Object.entries(srcFiles)) {
    const full = path.join(srcRoot, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  const config = parseI18nPruneConfig({
    locales: { source: 'en', directory: 'locales' },
    src: 'src',
    functions: ['t'],
  });
  return createCoreContext({
    config,
    adapters: createNodeRuntimeAdapters(),
    env: {},
    paths: { sourceLocale: sourcePath, localesDir, srcRoot },
  });
}

function analysisWithKeys(keys: string[]): ProjectAnalysis {
  const resolvedKeys = new Set(keys);
  return {
    version: 1,
    keyObservations: [],
    dynamicSites: [],
    missingKeys: [],
    counts: {
      keyObservations: keys.length,
      dynamicSites: 0,
      dynamicActive: 0,
      dynamicCommented: 0,
      sourceFilesScanned: 1,
      missingKeys: 0,
    },
    usage: { resolvedKeys, uncertainPrefixes: new Set(), usedRoots: new Set() },
  };
}

describe('locale suggestions', () => {
  it('computeUnusedSourceKeys finds keys not in scan', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-'));
    try {
      const ctx = flatCtx(
        root,
        { used: 'yes', orphan: 'dead' },
        { 'app.ts': `export const x = () => t('used');` },
      );
      const analysis = analysisWithKeys(['used']);
      const { candidates, count } = computeUnusedSourceKeys(ctx, analysis);
      expect(count).toBe(1);
      expect(candidates).toEqual(['orphan']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('buildLocaleSuggestions emits source unused with cleanup command', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-'));
    try {
      const ctx = flatCtx(root, { used: 'yes', orphan: 'dead' }, { 'app.ts': `t('used');` });
      const analysis = analysisWithKeys(['used']);
      const suggestions = buildLocaleSuggestions({ op: 'validate', ctx, analysis });
      expect(suggestions.map((s) => s.id)).toEqual(['suggest.cleanup.source_unused']);
      expect(suggestions[0]!.commands).toEqual(['i18nprune cleanup --dry-run']);
      expect(formatLocaleSuggestionHuman(suggestions[0]!)).toContain('→ i18nprune cleanup --dry-run');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('buildLocaleSuggestions adds missing literal hint on validate', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-'));
    try {
      const ctx = flatCtx(root, { used: 'yes' }, { 'app.ts': `t('used');` });
      const analysis = analysisWithKeys(['used', 'missing.key']);
      const suggestions = buildLocaleSuggestions({
        op: 'validate',
        ctx,
        analysis,
        missingKeyPaths: ['missing.key'],
      });
      expect(suggestions.map((s) => s.id)).toContain('suggest.missing.literal_keys');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('buildLocaleSuggestions uses --yes and --ask during cleanup dry-run', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-'));
    try {
      const ctx = flatCtx(root, { used: 'yes', orphan: 'dead' }, { 'app.ts': `t('used');` });
      const analysis = analysisWithKeys(['used']);
      const suggestions = buildLocaleSuggestions({
        op: 'cleanup',
        ctx,
        analysis,
        dryRun: true,
        cleanupRemoveCount: 1,
        cleanupRemoveKeys: ['orphan'],
      });
      expect(suggestions[0]!.commands).toEqual(['i18nprune cleanup --yes', 'i18nprune cleanup --ask']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('buildLocaleSuggestions lists segmented source paths in suggestion data', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-seg-'));
    try {
      const messagesDir = path.join(root, 'messages', 'en');
      fs.mkdirSync(messagesDir, { recursive: true });
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });
      fs.writeFileSync(path.join(messagesDir, 'common.json'), JSON.stringify({ 'app.title': 'Hi' }));
      fs.writeFileSync(path.join(messagesDir, 'stale.json'), JSON.stringify({ 'orphan.key': 'dead' }));
      fs.writeFileSync(path.join(root, 'src', 'app.ts'), `t('app.title');`);
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'locale_per_dir',
        },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: {
          sourceLocale: path.join(messagesDir, 'common.json'),
          localesDir: path.join(root, 'messages'),
          srcRoot: path.join(root, 'src'),
        },
      });
      const analysis = analysisWithKeys(['app.title']);
      const suggestions = buildLocaleSuggestions({ op: 'validate', ctx, analysis });
      const unused = suggestions.find((s) => s.id === 'suggest.cleanup.source_unused');
      expect(unused?.data?.segmentPaths).toContain('en/stale.json');
      expect(formatLocaleSuggestionHuman(unused!)).toContain('en/stale.json');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('buildLocaleSuggestions emits target-extra cleanup dry-run command', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-target-'));
    try {
      const enDir = path.join(root, 'messages', 'en');
      const frDir = path.join(root, 'messages', 'fr');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(frDir, { recursive: true });
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });
      fs.writeFileSync(path.join(enDir, 'common.json'), JSON.stringify({ 'app.title': 'Hi' }));
      fs.writeFileSync(path.join(frDir, 'common.json'), JSON.stringify({ 'app.title': 'Bonjour', 'extra.key': 'x' }));
      fs.writeFileSync(path.join(root, 'src', 'app.ts'), `t('app.title');`);
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'locale_per_dir',
        },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: {
          sourceLocale: path.join(enDir, 'common.json'),
          localesDir: path.join(root, 'messages'),
          srcRoot: path.join(root, 'src'),
        },
      });
      const analysis = analysisWithKeys(['app.title']);
      const extra = computeExtraTargetKeys(ctx, analysis, 'fr');
      expect(extra.count).toBe(1);
      expect(extra.candidates).toEqual(['extra.key']);
      const suggestions = buildLocaleSuggestions({ op: 'generate', ctx, analysis });
      const targetTip = suggestions.find((s) => s.id === 'suggest.cleanup.target_extra');
      expect(targetTip?.commands).toEqual(['i18nprune cleanup --target fr --dry-run']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
