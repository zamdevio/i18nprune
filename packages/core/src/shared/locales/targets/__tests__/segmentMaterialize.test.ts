import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseI18nPruneConfig } from '../../../../config/index.js';
import { createCoreContext } from '../../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../../runtime/exports/node.js';
import { resolveLocalesLayoutFromContext } from '../../layout/resolveLayout.js';
import type { TranslationSurfaceLeaf } from '../../../../types/locales/leaves/translationSurface.js';
import { materializeGenerateWorkingBySegment } from '../segmentMaterialize.js';

describe('materializeGenerateWorkingBySegment', () => {
  it('splits working locale by source segment fileOrigin', () => {
    const sourceLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'app.title',
        value: 'T',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
        fileOrigin: { file: '/m/en/app.json', locale: 'en', relativePath: 'en/app.json' },
      },
      {
        path: 'nav.home',
        value: 'H',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
        fileOrigin: { file: '/m/en/nav.json', locale: 'en', relativePath: 'en/nav.json' },
      },
    ];
    const working = {
      app: { title: 'ترجمة' },
      nav: { home: 'بيت' },
    };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-mat-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'en'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'en', 'app.json'), '{"app.title":"T"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'en', 'nav.json'), '{"nav.home":"H"}', 'utf8');
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
      const adapters = createNodeRuntimeAdapters();
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'en', 'app.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const layout = resolveLocalesLayoutFromContext(ctx);
      const parts = materializeGenerateWorkingBySegment({
        working,
        sourceLeaves,
        segments: [
          {
            locale: 'ar',
            relativePath: 'ar/app.json',
            absolutePath: path.join(messages, 'ar', 'app.json'),
            role: 'target',
          },
          {
            locale: 'ar',
            relativePath: 'ar/nav.json',
            absolutePath: path.join(messages, 'ar', 'nav.json'),
            role: 'target',
          },
        ],
        structure: layout.structure,
        sourceLocaleCode: 'en',
        layout,
        fs: adapters.fs,
        path: adapters.path,
      });
      expect(parts).toHaveLength(2);
      expect(parts[0]?.document).toEqual({ app: { title: 'ترجمة' } });
      expect(parts[1]?.document).toEqual({ nav: { home: 'بيت' } });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('preserves structured metadata terminals from working when writing segments', () => {
    const structuredLeaf = {
      value: 'translated',
      status: 'translated',
      confidence: null,
      needsReview: false,
      needsTranslationAgain: false,
      source: 'google',
    };
    const sourceLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'app.title',
        value: 'Title',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      },
    ];
    const working = { app: { title: structuredLeaf } };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-mat-struct-'));
    try {
      const locales = path.join(dir, 'locales');
      fs.mkdirSync(locales, { recursive: true });
      fs.writeFileSync(path.join(locales, 'en.json'), '{"app":{"title":"Title"}}', 'utf8');
      const config = parseI18nPruneConfig({
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      });
      const adapters = createNodeRuntimeAdapters();
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: {
          sourceLocale: path.join(locales, 'en.json'),
          localesDir: locales,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const layout = resolveLocalesLayoutFromContext(ctx);
      const [part] = materializeGenerateWorkingBySegment({
        working,
        sourceLeaves,
        segments: [
          {
            locale: 'ms',
            relativePath: 'ms.json',
            absolutePath: path.join(locales, 'ms.json'),
            role: 'target',
          },
        ],
        structure: layout.structure,
        sourceLocaleCode: 'en',
        layout,
        fs: adapters.fs,
        path: adapters.path,
      });
      expect(part?.document).toEqual({ app: { title: structuredLeaf } });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes nested keys when source segment uses flat dotted keys, preserving structured metadata', () => {
    const structuredLeaf = {
      value: 'Accesorio',
      status: 'translated',
      confidence: 0.62,
      needsReview: false,
      needsTranslationAgain: false,
      source: 'google-heuristic',
    };
    const sourceLeaves: TranslationSurfaceLeaf[] = [
      {
        path: 'app.title',
        value: 'Next app dir fixture',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
        fileOrigin: { file: '/m/app/en.json', locale: 'en', relativePath: 'app/en.json' },
      },
      {
        path: 'app.description',
        value: 'App Router-shaped tree',
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
        fileOrigin: { file: '/m/app/en.json', locale: 'en', relativePath: 'app/en.json' },
      },
    ];
    const working = {
      app: {
        title: structuredLeaf,
        description: { ...structuredLeaf, value: 'Árbol' },
      },
    };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-mat-flat-struct-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.writeFileSync(
        path.join(messages, 'app', 'en.json'),
        JSON.stringify({
          'app.title': 'Next app dir fixture',
          'app.description': 'App Router-shaped tree',
        }),
      );
      const config = parseI18nPruneConfig({
        locales: {
          source: 'en',
          directory: 'messages',
          mode: 'locale_directory',
          structure: 'feature_bundle',
        },
        src: 'src',
        functions: ['t'],
      });
      const adapters = createNodeRuntimeAdapters();
      const ctx = createCoreContext({
        config,
        adapters,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(dir, 'src'),
        },
      });
      const layout = resolveLocalesLayoutFromContext(ctx);
      const [part] = materializeGenerateWorkingBySegment({
        working,
        sourceLeaves,
        segments: [
          {
            locale: 'es',
            relativePath: 'app/es.json',
            absolutePath: path.join(messages, 'app', 'es.json'),
            role: 'target',
          },
        ],
        structure: layout.structure,
        sourceLocaleCode: 'en',
        layout,
        fs: adapters.fs,
        path: adapters.path,
      });
      expect(part?.document).toEqual({
        app: {
          title: structuredLeaf,
          description: { ...structuredLeaf, value: 'Árbol' },
        },
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
