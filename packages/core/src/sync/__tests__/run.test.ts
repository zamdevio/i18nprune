import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../../shared/constants/missing.js';
import {
  ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES,
  ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES,
} from '../../shared/constants/issueCodes.js';
import { emitSyncHumanMessages, runSync } from '../run.js';
import type { RunEvent } from '../../types/shared/run/index.js';

describe('runSync', () => {
  it('skips source placeholder leaves so missing sentinels are not copied into targets', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-sync-run-'));
    try {
      const localesDir = path.join(root, 'locales');
      const srcRoot = path.join(root, 'src');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.mkdirSync(srcRoot, { recursive: true });
      const sourcePath = path.join(localesDir, 'en.json');
      const targetPath = path.join(localesDir, 'fr.json');
      fs.writeFileSync(
        sourcePath,
        JSON.stringify({
          ready: 'Ready',
          scaffolded: DEFAULT_MISSING_LEAF_PLACEHOLDER,
        }),
      );
      fs.writeFileSync(
        targetPath,
        JSON.stringify({
          ready: DEFAULT_MISSING_LEAF_PLACEHOLDER,
          existing: DEFAULT_MISSING_LEAF_PLACEHOLDER,
        }),
      );

      const rt = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: {
          source: 'en',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        missing: { placeholder: DEFAULT_MISSING_LEAF_PLACEHOLDER },
      });
      const ctx = createCoreContext({
        config,
        adapters: rt,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
      });
      const events: RunEvent[] = [];
      const out = runSync(ctx, { target: 'fr' }, {
        emit: (event) => events.push(event),
        runId: 'test',
        emitProgress: () => {},
      });
      emitSyncHumanMessages(
        { emit: (event) => events.push(event), runId: 'test' },
        {
          result: out,
          dryRun: false,
          listLimit: 10,
          explicitStripMetadata: false,
          explicitMetadata: false,
        },
      );

      const target = JSON.parse(fs.readFileSync(targetPath, 'utf8')) as Record<string, unknown>;
      expect(target).toEqual({ ready: 'Ready' });
      expect(out.sourcePlaceholderLeaves.map((leaf) => leaf.path)).toEqual(['scaffolded']);
      expect(out.targetPlaceholderLeaves.map((leaf) => leaf.path)).toEqual(['ready', 'existing']);
      expect(out.issues.some((issue) => issue.code === ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES)).toBe(true);
      expect(out.issues.some((issue) => issue.code === ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES)).toBe(true);
      expect(
        events.some(
          (event) =>
            event.type === 'run.message' &&
            event.level === 'warn' &&
            event.message.includes('sync skipped those path(s)'),
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('overwrites target placeholder leaves from source before metadata normalization', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-sync-run-'));
    try {
      const localesDir = path.join(root, 'locales');
      const srcRoot = path.join(root, 'src');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.mkdirSync(srcRoot, { recursive: true });
      const sourcePath = path.join(localesDir, 'en.json');
      const targetPath = path.join(localesDir, 'fr.json');
      fs.writeFileSync(sourcePath, JSON.stringify({ ready: 'Ready' }));
      fs.writeFileSync(targetPath, JSON.stringify({ ready: DEFAULT_MISSING_LEAF_PLACEHOLDER }));

      const rt = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: {
          source: 'en',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        missing: { placeholder: DEFAULT_MISSING_LEAF_PLACEHOLDER },
      });
      const ctx = createCoreContext({
        config,
        adapters: rt,
        env: {},
        paths: { sourceLocale: sourcePath, localesDir, srcRoot },
      });

      const out = runSync(ctx, { target: 'fr', metadata: true }, {
        emitProgress: () => {},
      });

      const target = JSON.parse(fs.readFileSync(targetPath, 'utf8')) as { ready?: unknown };
      expect(target.ready).toEqual({
        value: 'Ready',
        status: 'pending',
        confidence: null,
        needsReview: true,
        needsTranslationAgain: true,
        source: 'sync',
      });
      expect(out.targetPlaceholderLeaves.map((leaf) => leaf.path)).toEqual(['ready']);
      expect(out.payload.localeMetadataReports?.['fr.json']?.structuredLeavesWritten).toBe(1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
