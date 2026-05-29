import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { buildQualityLocaleReport, formatQualityLocaleRowLabel } from '../localeReport.js';

describe('buildQualityLocaleReport', () => {
  it('groups feature_bundle segments by locale code', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-quality-fb-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'auth'), { recursive: true });
      fs.writeFileSync(
        path.join(messages, 'app', 'en.json'),
        JSON.stringify({ 'app.title': 'App', 'app.description': 'Desc' }),
      );
      fs.writeFileSync(
        path.join(messages, 'auth', 'en.json'),
        JSON.stringify({ 'auth.login': 'Login' }),
      );
      fs.writeFileSync(
        path.join(messages, 'app', 'fr.json'),
        JSON.stringify({ 'app.title': 'App', 'app.description': 'Desc FR' }),
      );
      fs.writeFileSync(
        path.join(messages, 'auth', 'fr.json'),
        JSON.stringify({ 'auth.login': 'Login' }),
      );
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const adapters = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: {
          source: 'messages/app/en.json',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
        },
        src: 'src',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: { ...adapters, system: { ...adapters.system, cwd: () => root } },
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });

      const report = buildQualityLocaleReport(ctx, {});
      expect(report.rows.map((row) => row.code).sort()).toEqual(['en', 'fr']);
      const fr = report.rows.find((row) => row.code === 'fr');
      expect(fr?.segmentCount).toBe(2);
      expect(fr?.leafCount).toBe(3);
      expect(fr?.sourceIdenticalLeafCount).toBe(2);
      expect(report.total).toBe(2);
      expect(formatQualityLocaleRowLabel(fr!)).toContain('fr · 2 segment files');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
