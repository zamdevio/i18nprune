import { describe, it, expect } from 'vitest';
import {
  docsCommandUrl,
  getDocsUrl,
  githubDocsUrl,
  GITHUB_BASE,
  GITHUB_DOCS_BASE,
  GITHUB_DOCS_TREE_BASE,
  normalizeNextraPublicPath,
  DOCS_SITE_BASE, GITHUB_OWNER, GITHUB_REPO 
} from './../index.js';

describe('constants/docs', () => {
  it('uses GITHUB_BASE for repo, blob, and tree URLs', () => {
    expect(GITHUB_OWNER).toBe('zamdevio');
    expect(GITHUB_REPO).toBe('i18nprune');
    expect(GITHUB_BASE).toBe(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`);
    expect(GITHUB_DOCS_BASE).toBe(`${GITHUB_BASE}/blob/main/docs`);
    expect(GITHUB_DOCS_TREE_BASE).toBe(`${GITHUB_BASE}/tree/main/docs`);
  });

  it('normalizeNextraPublicPath strips README index and .md for Nextra routes', () => {
    expect(normalizeNextraPublicPath('commands/report/README')).toBe('commands/report');
    expect(normalizeNextraPublicPath('commands/report/README.md')).toBe('commands/report');
    expect(normalizeNextraPublicPath('json/README')).toBe('json');
    expect(normalizeNextraPublicPath('json/README.md')).toBe('json');
    expect(normalizeNextraPublicPath('README')).toBe('');
    expect(normalizeNextraPublicPath('README.md')).toBe('');
    expect(normalizeNextraPublicPath('behavior/json-long')).toBe('behavior/json-long');
    expect(normalizeNextraPublicPath('json/issue-codes')).toBe('json/issue-codes');
    expect(normalizeNextraPublicPath('regex/README#detection-limits')).toBe('regex#detection-limits');
  });

  it('getDocsUrl uses Nextra-style paths when site is configured', () => {
    expect(DOCS_SITE_BASE).toBeTruthy();
    expect(getDocsUrl('commands/report/README')).toBe('https://docs.i18nprune.dev/commands/report/README');
    expect(getDocsUrl('commands/report')).toBe('https://docs.i18nprune.dev/commands/report/README');
    expect(getDocsUrl('json/README')).toBe('https://docs.i18nprune.dev/json');
    expect(getDocsUrl()).toBe('https://docs.i18nprune.dev');
    expect(getDocsUrl('behavior/json-long')).toBe('https://docs.i18nprune.dev/behavior/json-long');
    expect(getDocsUrl('regex/extraction')).toBe('https://docs.i18nprune.dev/regex/extraction/README');
    expect(getDocsUrl('exports/core')).toBe('https://docs.i18nprune.dev/exports/core');
    expect(getDocsUrl('barriers/dynamic-keys')).toBe('https://docs.i18nprune.dev/barriers/dynamic-keys');
    expect(getDocsUrl('barriers/dynamic-keys', { noReadme: true })).toBe(
      'https://docs.i18nprune.dev/barriers/dynamic-keys',
    );
    expect(getDocsUrl('exports/core', { noReadme: true })).toBe('https://docs.i18nprune.dev/exports/core');
    expect(getDocsUrl('dynamic')).toBe('https://docs.i18nprune.dev/dynamic/README');
    expect(getDocsUrl('dynamic/')).toBe('https://docs.i18nprune.dev/dynamic/README');
    expect(getDocsUrl('dynamic/README')).toBe('https://docs.i18nprune.dev/dynamic/README');
    expect(getDocsUrl('dynamic/README.md')).toBe('https://docs.i18nprune.dev/dynamic/README');
    expect(getDocsUrl('dynamic/README', { noReadme: true })).toBe('https://docs.i18nprune.dev/dynamic');
    expect(getDocsUrl('cursor/README')).toBe('https://docs.i18nprune.dev/cursor/README');
    expect(getDocsUrl('cursor')).toBe('https://docs.i18nprune.dev/cursor/README');
    expect(getDocsUrl('origin/README')).toBe('https://docs.i18nprune.dev/origin/README');
    expect(getDocsUrl('edge-cases')).toBe('https://docs.i18nprune.dev/edge-cases/README');
    expect(getDocsUrl('edge-cases/README')).toBe('https://docs.i18nprune.dev/edge-cases/README');
  });

  it('docsCommandUrl uses …/commands/{slug}/README for Nextra (folder index URL)', () => {
    expect(docsCommandUrl('report')).toBe('https://docs.i18nprune.dev/commands/report/README');
  });

  it('githubDocsUrl maps to blob README or kebab .md files', () => {
    expect(githubDocsUrl('commands/report/README')).toBe(`${GITHUB_DOCS_BASE}/commands/report/README.md`);
    expect(githubDocsUrl('json/issue-codes')).toBe(`${GITHUB_DOCS_BASE}/json/issue-codes.md`);
    expect(githubDocsUrl('phases/extension/README')).toBe(`${GITHUB_DOCS_BASE}/phases/extension/README.md`);
    expect(githubDocsUrl()).toBe(`${GITHUB_DOCS_BASE}/README.md`);
  });
});
