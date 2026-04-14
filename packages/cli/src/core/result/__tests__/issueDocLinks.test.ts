import { describe, expect, it } from 'vitest';
import {
  enrichIssuesWithDocHrefs,
  issueCodeDocHref,
  issueCodeToAnchorFragment,
} from '@/core/result/issueDocLinks.js';

describe('issueDocLinks', () => {
  it('maps dotted issue code to hyphen anchor fragment', () => {
    expect(issueCodeToAnchorFragment('i18nprune.io.read_failed')).toBe('i18nprune-io-read_failed');
  });

  it('builds docHref for issue code page anchors', () => {
    expect(issueCodeDocHref('i18nprune.context.discovery_warning')).toBe(
      'https://docs.i18nprune.dev/json/issue-codes#i18nprune-context-discovery_warning',
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
    expect(out[0]?.docHref).toBe(
      'https://docs.i18nprune.dev/json/issue-codes#i18nprune-scan-dynamic_key_sites',
    );
  });
});
