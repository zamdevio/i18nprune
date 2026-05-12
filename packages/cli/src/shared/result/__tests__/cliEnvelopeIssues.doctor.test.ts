import { describe, expect, it } from 'vitest';
import {
  ISSUE_DOCTOR_CONFIG_MISSING_FILE,
  ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING,
  ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING,
  ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE,
  ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH,
} from '@/constants/issueCodes.js';
import { issuesFromDoctorFindings } from '@/shared/result/index.js';
import type { DoctorFinding } from '@i18nprune/core';

describe('issuesFromDoctorFindings', () => {
  it('maps findings to i18nprune.doctor.* codes (underscore tails)', () => {
    const findings: DoctorFinding[] = [
      { id: 'runtime', ok: false, severity: 'error', title: 'Node', detail: 'old' },
      { id: 'tools', ok: false, severity: 'warn', title: 'rg', detail: 'missing' },
      { id: 'config', ok: true, severity: 'warn', title: 'No config', detail: 'x' },
      { id: 'paths', ok: false, severity: 'error', title: 'paths', detail: 'src missing' },
      { id: 'paths', ok: false, severity: 'warn', title: 'paths', detail: 'loc missing' },
    ];
    const issues = issuesFromDoctorFindings(findings);
    expect(issues.map((i) => i.code)).toEqual([
      ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE,
      ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH,
      ISSUE_DOCTOR_CONFIG_MISSING_FILE,
      ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING,
      ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING,
    ]);
  });

  it('uses issues/doctor docPath for doctor codes', () => {
    const issues = issuesFromDoctorFindings([
      { id: 'config', ok: true, severity: 'warn', title: 't', detail: 'd' },
    ]);
    expect(issues[0]?.docPath).toBe('issues/doctor');
    expect(issues[0]?.code).toBe(ISSUE_DOCTOR_CONFIG_MISSING_FILE);
  });
});
