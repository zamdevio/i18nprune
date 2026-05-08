import { describe, expect, it } from 'vitest';
import { enrichIssuesWithDocHrefs, issueCodeDocHref, resolveIssueCodeDocLink } from '../issueDocLinks.js';

describe('issueDocLinks', () => {
  it('resolves link parts in one shot', () => {
    expect(resolveIssueCodeDocLink('i18nprune.io.read_failed')).toEqual({
      parent: 'io',
      anchor: 'read-failed',
      sitePagePath: '/issues/io',
      repoDocPath: 'issues/io',
    });
  });

  it('uses short suffix slug as doc anchor for i18nprune topic codes', () => {
    expect(resolveIssueCodeDocLink('i18nprune.translate.identity_streak_abort').anchor).toBe(
      'identity-streak-abort',
    );
    expect(resolveIssueCodeDocLink('i18nprune.translate.unknown_translation_provider').anchor).toBe(
      'unknown-translation-provider',
    );
    expect(resolveIssueCodeDocLink('i18nprune.translate.provider_not_implemented_yet').anchor).toBe(
      'provider-not-implemented-yet',
    );
    expect(resolveIssueCodeDocLink('i18nprune.translate.missing_credentials').anchor).toBe('missing-credentials');
    expect(resolveIssueCodeDocLink('i18nprune.generate.usage').anchor).toBe('usage');
    expect(resolveIssueCodeDocLink('i18nprune.generate.usage').sitePagePath).toBe('/issues/generate');
    expect(resolveIssueCodeDocLink('i18nprune.io.read_failed').anchor).toBe('read-failed');
    expect(resolveIssueCodeDocLink('i18nprune.config.missing').anchor).toBe('missing');
    expect(resolveIssueCodeDocLink('i18nprune.languages.unsupported_language_code').anchor).toBe(
      'unsupported-language-code',
    );
  });

  it('slugifies patching issue tails for doc anchors', () => {
    expect(resolveIssueCodeDocLink('i18nprune.patching.config_parse_failed').anchor).toBe('config-parse-failed');
  });

  it('slugifies unknown dotted codes for a stable fallback anchor', () => {
    expect(resolveIssueCodeDocLink('i18nprune.unknown.my_issue').anchor).toBe('i18nprune-unknown-my-issue');
  });

  it('builds docHref for issue code page anchors', () => {
    expect(issueCodeDocHref('i18nprune.context.discovery_warning')).toBe(
      'https://docs.i18nprune.dev/issues/context#discovery-warning',
    );
  });

  it('enriches i18nprune issues with docHref and normalized docPath', () => {
    const out = enrichIssuesWithDocHrefs([
      {
        severity: 'warning',
        code: 'i18nprune.scan.dynamic_key_sites',
        message: 'dynamic sites found',
        docPath: 'commands/sync/README',
      },
    ]);
    expect(out[0]?.docPath).toBe('docs/commands/sync/README');
    expect(out[0]?.docHref).toBe('https://docs.i18nprune.dev/issues/scan#dynamic-key-sites');
  });
});
