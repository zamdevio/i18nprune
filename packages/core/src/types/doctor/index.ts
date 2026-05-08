export type DoctorCheckId = 'runtime' | 'tools' | 'config' | 'paths';

export type DoctorFinding = {
  id: DoctorCheckId;
  ok: boolean;
  severity: 'ok' | 'warn' | 'error';
  title: string;
  detail?: string;
};
