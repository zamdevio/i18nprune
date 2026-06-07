import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { buildLocaleSuggestions } from '../build.js';
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
    counts: { keyObservations: keys.length, dynamicSites: 0, sourceFilesScanned: 1, missingKeys: 0 },
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

  it('buildLocaleSuggestions uses apply command during cleanup dry-run', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-suggest-'));
    try {
      const ctx = flatCtx(root, { used: 'yes', orphan: 'dead' }, { 'app.ts': `t('used');` });
      const analysis = analysisWithKeys(['used']);
      const suggestions = buildLocaleSuggestions({ op: 'cleanup', ctx, analysis, dryRun: true });
      expect(suggestions[0]!.commands).toEqual(['i18nprune cleanup --apply']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
