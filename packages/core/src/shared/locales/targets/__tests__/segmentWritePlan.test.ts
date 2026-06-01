import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../../../config/index.js';
import { createCoreContext } from '../../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import { resolveLocaleSegmentAbsolutePath } from '../../enumerate/index.js';
import { resolveLocalesLayout } from '../../layout/resolveLayout.js';
import { toPosixPath } from '../../../path/posix.js';
import { resolvePrimaryTargetWritePath, resolveTargetLocaleWritePlan } from '../segmentWritePlan.js';
import { swapLocaleInSegmentRelativePath } from '../segmentWritePlan.js';

describe('swapLocaleInSegmentRelativePath', () => {
  it('locale_file: en.json → es.json', () => {
    expect(
      swapLocaleInSegmentRelativePath({
        structure: 'locale_file',
        relativePath: 'en.json',
        targetLocale: 'es',
      }),
    ).toBe('es.json');
  });

  it('locale_per_dir: en/app.json → es/app.json', () => {
    expect(
      swapLocaleInSegmentRelativePath({
        structure: 'locale_per_dir',
        relativePath: 'en/app.json',
        targetLocale: 'es',
      }),
    ).toBe('es/app.json');
  });

  it('feature_bundle: app/en.json → app/es.json', () => {
    expect(
      swapLocaleInSegmentRelativePath({
        structure: 'feature_bundle',
        relativePath: 'app/en.json',
        targetLocale: 'es',
      }),
    ).toBe('app/es.json');
  });
});

describe('resolveLocaleSegmentAbsolutePath + swap', () => {
  const bundleRoot = '/proj/messages';

  it('round-trips feature_bundle target path', () => {
    const layout = resolveLocalesLayout(
      {
        source: 'en',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'feature_bundle',
      },
      bundleRoot,
    );
    const rel = swapLocaleInSegmentRelativePath({
      structure: layout.structure,
      relativePath: 'app/en.json',
      targetLocale: 'es',
    });
    expect(rel).toBe('app/es.json');
    expect(
      resolveLocaleSegmentAbsolutePath({ layout, path, locale: 'es', segmentRelativePath: rel! }),
    ).toBe(`${bundleRoot}/app/es.json`);
  });

  it('round-trips locale_per_dir target path', () => {
    const layout = resolveLocalesLayout(
      {
        source: 'en',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'locale_per_dir',
      },
      bundleRoot,
    );
    const rel = swapLocaleInSegmentRelativePath({
      structure: layout.structure,
      relativePath: 'en/app.json',
      targetLocale: 'es',
    });
    expect(rel).toBe('es/app.json');
    expect(
      resolveLocaleSegmentAbsolutePath({ layout, path, locale: 'es', segmentRelativePath: rel! }),
    ).toBe(`${bundleRoot}/es/app.json`);
  });
});

describe('resolveTargetLocaleWritePlan', () => {
  it('returns one target segment per source segment for locale_per_dir', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-write-plan-multi-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'en'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'en', 'app.json'), '{"a":"A"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'en', 'nav.json'), '{"b":"B"}', 'utf8');
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
          sourceLocale: path.join(messages, 'en', 'app.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const plan = resolveTargetLocaleWritePlan(ctx, 'es');
      expect(plan.segments.map((s) => s.relativePath).sort()).toEqual(['es/app.json', 'es/nav.json']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('resolvePrimaryTargetWritePath', () => {
  it('derives feature_bundle path for a new target locale', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-write-plan-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), '{"a":"A"}', 'utf8');
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
        },
        src: 'app',
        functions: ['t'],
      });
      const ctx = createCoreContext({
        config,
        adapters: createNodeRuntimeAdapters(),
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'app'),
        },
      });
      expect(resolvePrimaryTargetWritePath(ctx, 'es')).toBe(
        toPosixPath(path.join(messages, 'app', 'es.json')),
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
