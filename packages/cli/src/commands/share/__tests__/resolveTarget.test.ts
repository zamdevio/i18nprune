import { describe, expect, it } from 'vitest';
import type { RunOptions } from '@i18nprune/core';
import { shareNeedIdIssue } from '../resolveTarget.js';

const jsonRun = { json: true, jsonPretty: false, quiet: false, silent: false, debugScan: false, debugCache: false } satisfies RunOptions;

describe('shareNeedIdIssue', () => {
  it('requires explicit ids in --json mode', () => {
    const issue = shareNeedIdIssue('view', true, jsonRun);
    expect(issue.severity).toBe('error');
    expect(issue.message).toContain('--project <id>');
    expect(issue.message).toContain('--json');
    expect(issue.message).not.toContain('TTY to pick');
  });

  it('uses non-interactive wording when json is off but stdin is not a TTY', () => {
    const issue = shareNeedIdIssue('view', true, { ...jsonRun, json: false });
    expect(issue.message).toContain('non-interactive');
  });
});
