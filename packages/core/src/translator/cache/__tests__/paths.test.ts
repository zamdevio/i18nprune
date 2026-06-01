import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveLocaleTranslationCachePath, resolveTranslationsDir } from '../paths.js';
import { createWin32MemoryCacheRuntime, win32CacheState } from './win32PathRuntime.js';

describe('translator/cache/paths', () => {
  it('resolveTranslationsDir uses path.join (Win32 backslashes)', () => {
    const projectDir = 'C:\\Users\\me\\.i18nprune\\cache\\projects\\abc123';
    const runtime = createWin32MemoryCacheRuntime();
    const state = win32CacheState(projectDir);
    const dir = resolveTranslationsDir(state, runtime);
    expect(dir).toBe(path.win32.join(projectDir, 'translations'));
    expect(dir).toContain('\\');
    expect(dir).not.toMatch(/\/translations$/);
  });

  it('resolveLocaleTranslationCachePath joins under translations with sanitized target lang', () => {
    const projectDir = 'C:\\cache\\projects\\proj';
    const runtime = createWin32MemoryCacheRuntime();
    const state = win32CacheState(projectDir);
    const filePath = resolveLocaleTranslationCachePath(state, runtime, 'fr');
    expect(filePath).toBe(path.win32.join(projectDir, 'translations', 'fr.json'));
    const unsafe = resolveLocaleTranslationCachePath(state, runtime, 'fr\\extra');
    expect(unsafe).toBe(path.win32.join(projectDir, 'translations', 'fr_extra.json'));
  });
});
