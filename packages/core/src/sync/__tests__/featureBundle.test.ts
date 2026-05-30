import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { runSync } from '../run.js';

describe('runSync feature_bundle', () => {
  it('syncs each target segment against its paired source segment, not the primary source file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-sync-fb-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'auth'), { recursive: true });
      fs.writeFileSync(
        path.join(messages, 'app', 'en.json'),
        JSON.stringify({ 'app.title': 'App title', 'app1.header': 'Header' }),
      );
      fs.writeFileSync(
        path.join(messages, 'auth', 'en.json'),
        JSON.stringify({ 'auth.login': 'Log in', 'auth.sign_in_prompt': 'Sign in' }),
      );
      fs.writeFileSync(
        path.join(messages, 'app', 'fr.json'),
        JSON.stringify({ 'app.title': 'Titre' }),
      );
      fs.writeFileSync(
        path.join(messages, 'auth', 'fr.json'),
        JSON.stringify({
          app: { title: 'Wrong', description: 'Wrong desc' },
        }),
      );
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const rt = createNodeRuntimeAdapters();
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
        adapters: rt,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });

      runSync(ctx, { target: 'fr' }, { emitProgress: () => {} });

      const authFr = JSON.parse(fs.readFileSync(path.join(messages, 'auth', 'fr.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(authFr.auth).toEqual({ login: 'Log in', sign_in_prompt: 'Sign in' });
      expect(authFr['auth.login']).toBeUndefined();

      const appFr = JSON.parse(fs.readFileSync(path.join(messages, 'app', 'fr.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      expect((appFr.app as Record<string, unknown>).title).toBe('Titre');
      expect(appFr['app.title']).toBeUndefined();
      expect(appFr.app1).toEqual({ header: 'Header' });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('second sync is unchanged after per-segment alignment', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-sync-fb-idem-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'auth'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'app', 'en.json'), JSON.stringify({ 'app.title': 'App' }));
      fs.writeFileSync(path.join(messages, 'auth', 'en.json'), JSON.stringify({ 'auth.login': 'Log in' }));
      fs.writeFileSync(path.join(messages, 'app', 'fr.json'), JSON.stringify({ app: { title: 'App FR' } }));
      fs.writeFileSync(path.join(messages, 'auth', 'fr.json'), JSON.stringify({ auth: { login: 'Log in FR' } }));
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const rt = createNodeRuntimeAdapters();
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
        adapters: rt,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });

      const first = runSync(ctx, { target: 'fr' }, { emitProgress: () => {} });
      const second = runSync(ctx, { target: 'fr' }, { emitProgress: () => {} });
      expect(first.updated).toBeGreaterThanOrEqual(0);
      expect(second.updated).toBe(0);
      expect(second.fileLines.every((f) => !f.changed)).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('normalizes dotted structured targets to nested without mirroring source when sync --metadata', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-sync-fb-meta-nested-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      const spanishTitle = {
        value: 'Accesorio del directorio',
        status: 'translated',
        confidence: 0.62,
        needsReview: false,
        needsTranslationAgain: false,
        source: 'google-heuristic',
      };
      const spanishDesc = {
        value: 'Árbol en forma de enrutador',
        status: 'translated',
        confidence: 0.63,
        needsReview: false,
        needsTranslationAgain: false,
        source: 'google-heuristic',
      };
      fs.writeFileSync(
        path.join(messages, 'app', 'en.json'),
        JSON.stringify({
          'app.title': 'Next app dir fixture',
          'app.description': 'App Router-shaped tree',
        }),
      );
      fs.writeFileSync(
        path.join(messages, 'app', 'es.json'),
        JSON.stringify({
          'app.title': spanishTitle,
          'app.description': spanishDesc,
          app: {
            title: {
              value: 'Next app dir fixture',
              status: 'pending',
              confidence: null,
              needsReview: true,
              needsTranslationAgain: true,
              source: 'sync',
            },
            description: {
              value: 'App Router-shaped tree',
              status: 'pending',
              confidence: null,
              needsReview: true,
              needsTranslationAgain: true,
              source: 'sync',
            },
          },
        }),
      );
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const rt = createNodeRuntimeAdapters();
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
        adapters: rt,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });

      runSync(ctx, { target: 'es', metadata: true }, { emitProgress: () => {} });
      const es = JSON.parse(fs.readFileSync(path.join(messages, 'app', 'es.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(es['app.title']).toBeUndefined();
      expect(es['app.description']).toBeUndefined();
      expect(es.app).toEqual({
        title: spanishTitle,
        description: spanishDesc,
      });

      const second = runSync(ctx, { target: 'es', metadata: true }, { emitProgress: () => {} });
      expect(second.updated).toBe(0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('preserves nested structured targets when source uses flat dotted keys', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-sync-fb-nested-'));
    try {
      const messages = path.join(root, 'messages');
      fs.mkdirSync(path.join(messages, 'app'), { recursive: true });
      fs.writeFileSync(
        path.join(messages, 'app', 'en.json'),
        JSON.stringify({
          'app.title': 'Next app dir fixture',
          'app.description': 'App Router-shaped tree',
        }),
      );
      fs.writeFileSync(
        path.join(messages, 'app', 'es.json'),
        JSON.stringify({
          app: {
            title: {
              value: 'Accesorio del directorio',
              status: 'translated',
              confidence: 0.62,
              needsReview: false,
              needsTranslationAgain: false,
              source: 'google-heuristic',
            },
            description: {
              value: 'Árbol en forma de enrutador',
              status: 'translated',
              confidence: 0.63,
              needsReview: false,
              needsTranslationAgain: false,
              source: 'google-heuristic',
            },
          },
        }),
      );
      fs.mkdirSync(path.join(root, 'src'), { recursive: true });

      const rt = createNodeRuntimeAdapters();
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
        adapters: rt,
        env: {},
        paths: {
          sourceLocale: path.join(messages, 'app', 'en.json'),
          localesDir: messages,
          srcRoot: path.join(root, 'src'),
        },
      });

      const first = runSync(ctx, { target: 'es' }, { emitProgress: () => {} });
      const es = JSON.parse(fs.readFileSync(path.join(messages, 'app', 'es.json'), 'utf8')) as Record<
        string,
        unknown
      >;
      expect(es.app).toEqual(
        expect.objectContaining({
          title: expect.objectContaining({ value: 'Accesorio del directorio', status: 'translated' }),
          description: expect.objectContaining({ value: 'Árbol en forma de enrutador', status: 'translated' }),
        }),
      );
      expect(es['app.title']).toBeUndefined();
      expect(first.updated).toBe(0);

      const second = runSync(ctx, { target: 'es' }, { emitProgress: () => {} });
      expect(second.updated).toBe(0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
