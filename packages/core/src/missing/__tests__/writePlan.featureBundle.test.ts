import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { readLocaleLeavesForCode } from '../../shared/locales/surface/localeSurface.js';
import { createMissingWritePlan } from '../writePlan.js';
import { resolveMissingPathsPlan } from '../resolvePaths.js';
import { sourceLocaleCodeFromContext } from '../../shared/locales/targets/index.js';

describe('missing write plan (feature_bundle)', () => {
  it('routes new keys to matching feature segment files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-missing-fb-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'auth'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'settings'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), JSON.stringify({ 'app.title': 'App' }));
      fs.writeFileSync(path.join(messages, 'auth', 'en.json'), JSON.stringify({}));
      fs.writeFileSync(path.join(messages, 'settings', 'en.json'), JSON.stringify({}));
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const nodeAdapters = createNodeRuntimeAdapters();
      const adapters = {
        ...nodeAdapters,
        system: { ...nodeAdapters.system, cwd: () => root },
      };
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
        adapters,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });
      const sourceCode = sourceLocaleCodeFromContext(ctx);
      const sourceLeaves = readLocaleLeavesForCode(ctx, sourceCode);
      const resolvedKeys = new Set(['auth.login', 'app.title']);
      const { toAdd } = resolveMissingPathsPlan({ localeLeaves: sourceLeaves, resolvedKeys });
      expect(toAdd).toEqual(['auth.login']);

      const plan = createMissingWritePlan(ctx, sourceCode, toAdd);
      expect(plan).toHaveLength(1);
      expect(plan[0]?.relativePath).toBe('auth/en.json');
      expect(plan[0]?.paths).toEqual(['auth.login']);

      const frPlan = createMissingWritePlan(ctx, 'fr', ['auth.login', 'settings.open']);
      expect(frPlan.map((w) => w.relativePath).sort()).toEqual(['auth/fr.json', 'settings/fr.json']);
      expect(frPlan.find((w) => w.relativePath === 'auth/fr.json')?.paths).toEqual(['auth.login']);
      expect(frPlan.find((w) => w.relativePath === 'settings/fr.json')?.paths).toEqual(['settings.open']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
