/** Stable identifiers for the built-in doctor checks. */
export type DoctorCheckId = 'runtime' | 'tools' | 'config' | 'paths';

/** Single finding produced by a doctor check. */
export type DoctorFinding = {
  id: DoctorCheckId;
  ok: boolean;
  severity: 'ok' | 'warn' | 'error';
  title: string;
  detail?: string;
};
