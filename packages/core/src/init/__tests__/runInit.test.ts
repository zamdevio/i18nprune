import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { runInit } from '../run.js';

describe('runInit', () => {
  it('returns unknown preset issue', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-init-'));
    try {
      const adapters = createNodeRuntimeAdapters();
      const r = runInit(
        { fs: adapters.fs, path: adapters.path, projectRoot: dir, skippedExistingConfig: false },
        { preset: 'not-a-real-preset' },
      );
      expect(r.exitCode).toBe(1);
      expect(r.issues.some((i) => i.code === 'i18nprune.init.unknown_preset')).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('emits mode and structure when locale segments agree under preset directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-init-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'en'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'fr'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'en', 'common.json'), '{"a":"A"}', 'utf8');
      fs.writeFileSync(path.join(messages, 'fr', 'common.json'), '{"a":"A"}', 'utf8');
      const adapters = createNodeRuntimeAdapters();
      const r = runInit(
        { fs: adapters.fs, path: adapters.path, projectRoot: dir, skippedExistingConfig: false },
        { preset: 'next-intl' },
      );
      expect(r.exitCode).toBe(0);
      expect(r.payload.proposedConfigSource).toContain("mode: 'locale_directory'");
      expect(r.payload.proposedConfigSource).toContain("structure: 'locale_per_dir'");
      expect(r.payload.detection?.localeLayout?.structure).toBe('locale_per_dir');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('next-intl package + messages directory picks next-intl under --auto', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-init-'));
    try {
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ dependencies: { 'next-intl': '^3.0.0', next: '^15.0.0' } }),
        'utf8',
      );
      fs.mkdirSync(path.join(dir, 'messages'));
      const adapters = createNodeRuntimeAdapters();
      const r = runInit(
        { fs: adapters.fs, path: adapters.path, projectRoot: dir, skippedExistingConfig: false },
        { auto: true },
      );
      expect(r.exitCode).toBe(0);
      expect(r.payload.preset).toBe('next-intl');
      expect(r.payload.proposedConfigSource).toContain('messages/en.json');
      expect(r.payload.detection?.ambiguous).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('skippedExistingConfig short-circuits without detection', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-init-'));
    try {
      const adapters = createNodeRuntimeAdapters();
      const r = runInit({
        fs: adapters.fs,
        path: adapters.path,
        projectRoot: dir,
        skippedExistingConfig: true,
      });
      expect(r.exitCode).toBe(0);
      expect(r.payload.skippedExistingConfig).toBe(true);
      expect(r.payload.proposedConfigSource).toBe('');
      expect(r.payload.detection).toBeUndefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
