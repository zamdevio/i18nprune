import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { runCleanup } from '../run.js';
import type { CleanupHostHooks } from '../../types/cleanup/index.js';
import type { CoreContext } from '../../types/context/index.js';

/**
 * Regression coverage for the uncertain-prefix protection contract in `cleanup`.
 *
 * BUG-002: `cleanup --target <locale>` used a second candidate path that never consulted the
 * uncertain-prefix list, so `cleanup --target so --yes` deleted live translated keys under dynamic
 * families while source-mode `cleanup` protected them.
 *
 * BUG-001: declared `policies.preserve.uncertainPrefixes` was never read by cleanup, so the
 * documented knob (`docs/config/policies.md`) protected nothing.
 */

const HOST: CleanupHostHooks = {
  isStringPresenceAvailable: () => false,
  hasStringPresence: () => false,
  getStringPresenceLocations: () => [],
  shouldRunStringPresenceForKey: () => false,
};

type ProjectFixture = {
  root: string;
  ctx: CoreContext;
};

/** `locale_directory` + `locale_per_dir` project (`locales/<code>/about.json`). */
function makeProject(input: {
  src: string;
  sourceJson: Record<string, string>;
  targetJson: Record<string, string>;
  preserve?: Record<string, unknown>;
}): ProjectFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cleanup-uncertain-'));
  const localesDir = path.join(root, 'locales');
  const srcRoot = path.join(root, 'src');
  fs.mkdirSync(path.join(localesDir, 'en'), { recursive: true });
  fs.mkdirSync(path.join(localesDir, 'so'), { recursive: true });
  fs.mkdirSync(srcRoot, { recursive: true });
  fs.writeFileSync(path.join(localesDir, 'en', 'about.json'), JSON.stringify(input.sourceJson, null, 2));
  fs.writeFileSync(path.join(localesDir, 'so', 'about.json'), JSON.stringify(input.targetJson, null, 2));
  fs.writeFileSync(path.join(srcRoot, 'app.ts'), input.src);

  const config = parseI18nPruneConfig({
    locales: {
      source: 'en',
      directory: 'locales',
      mode: 'locale_directory',
      structure: 'locale_per_dir',
    },
    src: 'src',
    functions: ['t'],
    ...(input.preserve ? { policies: { preserve: input.preserve } } : {}),
  });
  const ctx = createCoreContext({
    config,
    adapters: createNodeRuntimeAdapters(),
    env: {},
    paths: {
      sourceLocale: path.join(localesDir, 'en', 'about.json'),
      localesDir,
      srcRoot,
    },
  });
  return { root, ctx };
}

const SOURCE_JSON = {
  'studio.role.admin': 'Admin',
  'studio.role.editor': 'Editor',
  'static.used': 'Used',
  'static.orphan': 'Orphan',
};
const TARGET_JSON = {
  'studio.role.admin': 'Maamule',
  'studio.role.editor': 'Tifaftire',
  'static.used': 'La isticmaalay',
  'static.orphan': 'La tuuray',
};

describe('cleanup uncertain-prefix protection (BUG-002)', () => {
  it('--target honours scan-derived uncertain prefixes exactly like source mode', () => {
    const { root, ctx } = makeProject({
      // Template hole makes `studio.role` an uncertain prefix via the scan.
      src: "export const a = t('static.used');\nexport const b = (role: string) => t(`studio.role.${role}`);\n",
      sourceJson: SOURCE_JSON,
      targetJson: TARGET_JSON,
    });
    try {
      const source = runCleanup(ctx, { dryRun: true, skipStringPresenceCheck: true }, HOST);
      const target = runCleanup(ctx, { dryRun: true, skipStringPresenceCheck: true, target: 'so' }, HOST);

      // The dynamic family is protected in both scopes — only the genuine orphan is offered.
      expect(source.payload.keys.sort()).toEqual(['static.orphan']);
      expect(target.payload.keys.sort()).toEqual(['static.orphan']);

      // The guard actually fired (not merely absent because the keys were never candidates).
      expect(source.excludedUncertain).toBe(2);
      expect(target.excludedUncertain).toBe(2);

      // The payload must not blank the uncertain list just because the scope is a target locale.
      expect(source.payload.uncertainPrefixes).toContain('studio.role');
      expect(target.payload.uncertainPrefixes).toContain('studio.role');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('--target never proposes removal for a live translated dynamic family', () => {
    const { root, ctx } = makeProject({
      src: "export const a = t('static.used');\nexport const b = (role: string) => t(`studio.role.${role}`);\n",
      sourceJson: SOURCE_JSON,
      targetJson: TARGET_JSON,
    });
    try {
      // Mirrors `cleanup --target so --yes`: what a user would actually lose.
      const target = runCleanup(ctx, { target: 'so', skipStringPresenceCheck: true }, HOST);
      expect(target.safeToRemove).not.toContain('studio.role.admin');
      expect(target.safeToRemove).not.toContain('studio.role.editor');
      expect(target.safeToRemove.sort()).toEqual(['static.orphan']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('declared policies.preserve.uncertainPrefixes (BUG-001)', () => {
  it('protects declared roots in both source and --target mode without scan anchors', () => {
    const { root, ctx } = makeProject({
      // No dynamic call sites at all: the only source of uncertainty is the configuration.
      src: "export const a = t('static.used');\n",
      sourceJson: SOURCE_JSON,
      targetJson: TARGET_JSON,
      preserve: { uncertainPrefixes: ['studio.role'] },
    });
    try {
      const source = runCleanup(ctx, { dryRun: true, skipStringPresenceCheck: true }, HOST);
      const target = runCleanup(ctx, { dryRun: true, skipStringPresenceCheck: true, target: 'so' }, HOST);

      expect(source.payload.keys.sort()).toEqual(['static.orphan']);
      expect(target.payload.keys.sort()).toEqual(['static.orphan']);
      expect(source.excludedUncertain).toBe(2);
      expect(target.excludedUncertain).toBe(2);

      // Declared prefixes are surfaced as uncertain prefixes (the documented contract).
      expect(source.payload.uncertainPrefixes).toContain('studio.role');
      expect(target.payload.uncertainPrefixes).toContain('studio.role');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('normalizes trailing dots on declared prefixes', () => {
    const { root, ctx } = makeProject({
      src: "export const a = t('static.used');\n",
      sourceJson: SOURCE_JSON,
      targetJson: TARGET_JSON,
      preserve: { uncertainPrefixes: ['studio.role.'] },
    });
    try {
      const source = runCleanup(ctx, { dryRun: true, skipStringPresenceCheck: true }, HOST);
      expect(source.payload.keys.sort()).toEqual(['static.orphan']);
      expect(source.excludedUncertain).toBe(2);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
