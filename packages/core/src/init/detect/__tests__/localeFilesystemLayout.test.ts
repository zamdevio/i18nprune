import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { detectLocaleFilesystemLayout } from '../localeFilesystemLayout.js';

describe('detectLocaleFilesystemLayout', () => {
  it('detects flat_file + locale_file for root-level locale JSON files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-layout-'));
    try {
      const localesDir = path.join(dir, 'locales');
      fs.mkdirSync(localesDir, { recursive: true });
      fs.writeFileSync(path.join(localesDir, 'en.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(localesDir, 'fr.json'), '{}', 'utf8');
      const adapters = createNodeRuntimeAdapters();
      const hint = detectLocaleFilesystemLayout(
        { fs: adapters.fs, path: adapters.path },
        dir,
        'locales',
      );
      expect(hint).toEqual({
        mode: 'flat_file',
        structure: 'locale_file',
        confidence: 1,
        segmentCount: 2,
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects locale_directory + locale_per_dir', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-layout-'));
    try {
      const messages = path.join(dir, 'messages');
      fs.mkdirSync(path.join(messages, 'en'), { recursive: true });
      fs.mkdirSync(path.join(messages, 'fr'), { recursive: true });
      fs.writeFileSync(path.join(messages, 'en', 'auth.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(messages, 'fr', 'auth.json'), '{}', 'utf8');
      const adapters = createNodeRuntimeAdapters();
      const hint = detectLocaleFilesystemLayout(
        { fs: adapters.fs, path: adapters.path },
        dir,
        'messages',
      );
      expect(hint?.mode).toBe('locale_directory');
      expect(hint?.structure).toBe('locale_per_dir');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects locale_directory + feature_bundle', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-layout-'));
    try {
      const locales = path.join(dir, 'locales');
      fs.mkdirSync(path.join(locales, 'auth'), { recursive: true });
      fs.mkdirSync(path.join(locales, 'dashboard'), { recursive: true });
      fs.writeFileSync(path.join(locales, 'auth', 'en.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(locales, 'dashboard', 'en.json'), '{}', 'utf8');
      const adapters = createNodeRuntimeAdapters();
      const hint = detectLocaleFilesystemLayout(
        { fs: adapters.fs, path: adapters.path },
        dir,
        'locales',
      );
      expect(hint?.mode).toBe('locale_directory');
      expect(hint?.structure).toBe('feature_bundle');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns null when segment layouts disagree', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-layout-'));
    try {
      const locales = path.join(dir, 'locales');
      fs.mkdirSync(locales, { recursive: true });
      fs.mkdirSync(path.join(locales, 'en'), { recursive: true });
      fs.writeFileSync(path.join(locales, 'en.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(locales, 'en', 'auth.json'), '{}', 'utf8');
      const adapters = createNodeRuntimeAdapters();
      expect(
        detectLocaleFilesystemLayout({ fs: adapters.fs, path: adapters.path }, dir, 'locales'),
      ).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
