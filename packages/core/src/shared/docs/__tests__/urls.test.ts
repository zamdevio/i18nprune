import { describe, expect, it } from 'vitest';
import { DOCS_SITE_BASE } from '../../constants/links.js';
import {
  DOCS_SITE_ORIGIN,
  GITHUB_BASE,
  GITHUB_DOCS_BASE,
  GITHUB_DOCS_TREE_BASE,
} from '../../constants/docs.js';
import { GITHUB_OWNER, GITHUB_REPO } from '../../constants/links.js';
import { docsCommandUrl, getDocsUrl } from '../index.js';

describe('shared/docs urls', () => {
  it('uses GITHUB_BASE for repo, blob, and tree URLs', () => {
    expect(GITHUB_OWNER).toBe('zamdevio');
    expect(GITHUB_REPO).toBe('i18nprune');
    expect(GITHUB_BASE).toBe(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`);
    expect(GITHUB_DOCS_BASE).toBe(`${GITHUB_BASE}/blob/main/docs`);
    expect(GITHUB_DOCS_TREE_BASE).toBe(`${GITHUB_BASE}/tree/main/docs`);
    expect(DOCS_SITE_ORIGIN).toBe(DOCS_SITE_BASE);
  });

  it('getDocsUrl uses clean folder paths (no /README) when site is configured', () => {
    expect(DOCS_SITE_BASE).toBeTruthy();
    expect(getDocsUrl('commands/report/README')).toBe('https://docs.i18nprune.dev/commands/report');
    expect(getDocsUrl('commands/report')).toBe('https://docs.i18nprune.dev/commands/report');
    expect(getDocsUrl('json/README')).toBe('https://docs.i18nprune.dev/json');
    expect(getDocsUrl()).toBe('https://docs.i18nprune.dev');
    expect(getDocsUrl('behavior/json-long')).toBe('https://docs.i18nprune.dev/behavior/json-long');
    expect(getDocsUrl('regex/extraction')).toBe('https://docs.i18nprune.dev/regex/extraction');
    expect(getDocsUrl('exports/core')).toBe('https://docs.i18nprune.dev/exports/core');
    expect(getDocsUrl('barriers/dynamic-keys')).toBe('https://docs.i18nprune.dev/barriers/dynamic-keys');
    expect(getDocsUrl('dynamic')).toBe('https://docs.i18nprune.dev/dynamic');
    expect(getDocsUrl('dynamic/')).toBe('https://docs.i18nprune.dev/dynamic');
    expect(getDocsUrl('dynamic/README')).toBe('https://docs.i18nprune.dev/dynamic');
    expect(getDocsUrl('dynamic/README.md')).toBe('https://docs.i18nprune.dev/dynamic');
    expect(getDocsUrl('cursor/README')).toBe('https://docs.i18nprune.dev/cursor');
    expect(getDocsUrl('cursor')).toBe('https://docs.i18nprune.dev/cursor');
    expect(getDocsUrl('origin/README')).toBe('https://docs.i18nprune.dev/origin');
    expect(getDocsUrl('edge-cases')).toBe('https://docs.i18nprune.dev/edge-cases');
    expect(getDocsUrl('edge-cases/README')).toBe('https://docs.i18nprune.dev/edge-cases');
    expect(getDocsUrl('issues/README')).toBe('https://docs.i18nprune.dev/issues');
    expect(getDocsUrl('json/legacy-stub')).toBe('https://docs.i18nprune.dev/json/legacy-stub');
  });

  it('getDocsUrl keeps hash fragments on clean paths', () => {
    expect(getDocsUrl('issues#i18nprune-scan-dynamic_key_sites')).toBe(
      'https://docs.i18nprune.dev/issues#i18nprune-scan-dynamic_key_sites',
    );
    expect(getDocsUrl('onboarding#_4-keep-this-in-ci')).toBe(
      'https://docs.i18nprune.dev/onboarding#_4-keep-this-in-ci',
    );
    expect(getDocsUrl('regex/README#detection-limits')).toBe(
      'https://docs.i18nprune.dev/regex#detection-limits',
    );
  });

  it('docsCommandUrl uses /commands/{slug} without /README', () => {
    expect(docsCommandUrl('report')).toBe('https://docs.i18nprune.dev/commands/report');
  });
});
