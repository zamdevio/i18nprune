import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  classifyLocalesSourceInput,
  resolveSourceLocaleAbsolutePath,
  validateLocalesSourceConfigValue,
} from '../locales/index.js';

describe('locales source validate', () => {
  it('classifies language codes vs paths and json filenames', () => {
    expect(classifyLocalesSourceInput('en')).toBe('language_code');
    expect(classifyLocalesSourceInput('pt-BR')).toBe('language_code');
    expect(classifyLocalesSourceInput('locales/en.json')).toBe('path');
    expect(classifyLocalesSourceInput('en.json')).toBe('json_filename');
  });

  it('rejects file paths', () => {
    const r = validateLocalesSourceConfigValue('messages/en/app.json');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('locales.source');
      expect(
        r.message.includes('not a file path') || r.message.includes('not a supported language code'),
      ).toBe(true);
    }
  });

  it('rejects path to unknown json with catalog hints on full value', () => {
    const r = validateLocalesSourceConfigValue('locales/soo.json');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('"locales/soo.json"');
      expect(r.message).toContain('try:');
      expect(r.issueCode).toBe('i18nprune.languages.unsupported_language_code');
    }
  });

  it('rejects json basename with catalog hint when stem is unknown', () => {
    const r = validateLocalesSourceConfigValue('een.json');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('"een.json"');
      expect(r.message).toContain('try:');
    }
  });

  it('rejects json basename with plain fix when stem is a catalog code', () => {
    const r = validateLocalesSourceConfigValue('en.json');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('"en"');
      expect(r.message).toContain('"en.json"');
      expect(r.message).not.toContain('try:');
    }
  });

  it('rejects unsupported catalog codes with suggestions', () => {
    const r = validateLocalesSourceConfigValue('zz');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('try:');
      expect(r.message).toContain('"zz"');
    }
  });

  it('accepts catalog-backed codes', () => {
    const r = validateLocalesSourceConfigValue('en');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.code).toBe('en');
  });
});

describe('locales source resolve', () => {
  it('resolves flat_file source absolute path', () => {
    const root = path.join('/proj', 'locales');
    const abs = resolveSourceLocaleAbsolutePath({
      locales: { source: 'en', directory: 'locales' },
      directoryAbsolute: root,
      path,
    });
    expect(abs).toBe(path.join(root, 'en.json'));
  });
});
