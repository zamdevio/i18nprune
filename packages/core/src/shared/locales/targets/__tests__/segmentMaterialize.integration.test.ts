import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../../../config/index.js';
import { createCoreContext } from '../../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import { getAtPath, setAtPath } from '../../../json/path.js';
import { readLocalePerDirLocaleSurface } from '../../read/bundle.js';
import { resolveLocalesLayoutFromContext } from '../../layout/resolveLayout.js';
import {
  materializeGenerateWorkingBySegment,
  resolveTargetLocaleWritePlan,
  sourceLocaleCodeFromContext,
} from '../index.js';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../../../..', import.meta.url)));
const nextjsRoot = path.join(repoRoot, 'tests/fixtures/stacks/nextjs');

describe('materializeGenerateWorkingBySegment (nextjs fixture)', () => {
  it('maps translated working into per-feature segment files', async () => {
    const configMjs = path.join(nextjsRoot, 'i18nprune.config.mjs');
    const config = parseI18nPruneConfig((await import(configMjs)).default);
    const adapters = createNodeRuntimeAdapters();
    const ctx = createCoreContext({
      config,
      adapters,
      env: {},
      paths: {
        sourceLocale: path.join(nextjsRoot, 'messages/app/en.json'),
        localesDir: path.join(nextjsRoot, 'messages'),
        srcRoot: path.join(nextjsRoot, 'app'),
      },
    });
    const layout = resolveLocalesLayoutFromContext(ctx);
    const sourceCode = sourceLocaleCodeFromContext(ctx);
    const read = readLocalePerDirLocaleSurface({
      layout,
      fs: ctx.adapters.fs,
      path: ctx.adapters.path,
      localeCode: sourceCode,
    });
    expect(read.ok).toBe(true);
    expect(read.leaves.some((l) => l.fileOrigin?.relativePath === 'app/en.json')).toBe(true);
    expect(read.leaves.some((l) => l.fileOrigin?.relativePath === 'common/en.json')).toBe(true);

    let working: unknown = {};
    for (const leaf of read.leaves) {
      working = setAtPath(working, leaf.path, `T-${leaf.value}`);
    }
    expect(getAtPath(working, 'app.title')).toBeDefined();

    const writePlan = resolveTargetLocaleWritePlan(ctx, 'ar');
    const parts = materializeGenerateWorkingBySegment({
      working,
      sourceLeaves: read.leaves,
      segments: writePlan.segments,
      structure: writePlan.layout.structure,
      sourceLocaleCode: sourceCode,
      layout,
      fs: ctx.adapters.fs,
      path: ctx.adapters.path,
    });
    const appPart = parts.find((p) => p.segment.relativePath === 'app/ar.json');
    const commonPart = parts.find((p) => p.segment.relativePath === 'common/ar.json');
    expect(appPart?.document).not.toEqual({});
    expect(getAtPath(appPart?.document, 'app.title')).toMatch(/^T-/);
    expect(commonPart?.document).not.toEqual({});
  });
});
