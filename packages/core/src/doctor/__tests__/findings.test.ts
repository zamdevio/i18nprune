import { describe, it, expect } from 'vitest';
import {
  doctorExitCode,
  DOCTOR_CHECK_IDS,
  collectDoctorFindingsFromInputs,
  evaluateRuntimeFinding,
} from '../findings.js';
import type { DoctorFinding } from '@i18nprune/core/types';

describe('doctor findings', () => {
  it('DOCTOR_CHECK_IDS is stable and ordered', () => {
    expect(DOCTOR_CHECK_IDS).toEqual(['runtime', 'tools', 'config', 'paths']);
  });

  it('evaluateRuntimeFinding errors on Node < 18', () => {
    const f = evaluateRuntimeFinding('v16.0.0');
    expect(f.severity).toBe('error');
    expect(f.ok).toBe(false);
  });

  it('evaluateRuntimeFinding ok on Node >= 18', () => {
    const f = evaluateRuntimeFinding('v20.1.0');
    expect(f.severity).toBe('ok');
    expect(f.ok).toBe(true);
  });

  it('collectDoctorFindingsFromInputs respects --only', () => {
    const findings = collectDoctorFindingsFromInputs({
      onlyRaw: 'runtime',
      nodeVersion: 'v20.0.0',
      rgAvailable: true,
      hasConfigFile: false,
      configPathLabel: null,
      paths: {
        sourceLocale: '/a/en.json',
        localesDir: '/a/l',
        srcRoot: '/a/s',
        pathExists: () => true,
      },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.id).toBe('runtime');
  });

  it('doctorExitCode strict mode', () => {
    const warnOnly: DoctorFinding[] = [{ id: 'tools', ok: false, severity: 'warn', title: 'x' }];
    expect(doctorExitCode(warnOnly, false)).toBe(0);
    expect(doctorExitCode(warnOnly, true)).toBe(1);
  });
});
