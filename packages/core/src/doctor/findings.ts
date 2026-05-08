import type { DoctorCheckId, DoctorFinding } from '../types/doctor/index.js';

export const DOCTOR_CHECK_IDS: readonly DoctorCheckId[] = ['runtime', 'tools', 'config', 'paths'];

function parseDoctorOnlyList(raw?: string): Set<DoctorCheckId> | null {
  if (raw === undefined || raw.trim() === '') return null;
  const set = new Set<DoctorCheckId>();
  for (const part of raw.split(',')) {
    const k = part.trim().toLowerCase();
    if (DOCTOR_CHECK_IDS.includes(k as DoctorCheckId)) {
      set.add(k as DoctorCheckId);
    }
  }
  return set.size > 0 ? set : null;
}

function nodeMajorFromVersion(version: string): number {
  const m = /^v(\d+)/.exec(version);
  return m ? Number(m[1]) : 0;
}

export function evaluateRuntimeFinding(nodeVersion: string): DoctorFinding {
  const major = nodeMajorFromVersion(nodeVersion);
  const ok = major >= 18;
  return {
    id: 'runtime',
    ok,
    severity: ok ? 'ok' : 'error',
    title: `Node.js ${nodeVersion}`,
    detail: ok ? 'Meets engine requirement (>= 18).' : 'Requires Node.js 18 or newer.',
  };
}

export function evaluateToolsFinding(rgAvailable: boolean): DoctorFinding {
  return {
    id: 'tools',
    ok: rgAvailable,
    severity: rgAvailable ? 'ok' : 'warn',
    title: rgAvailable ? 'ripgrep (rg) is on PATH' : 'ripgrep (rg) not found on PATH',
    detail: rgAvailable
      ? 'Cleanup can use rg for safer reference checks.'
      : 'Install rg for stronger cleanup safety: https://github.com/BurntSushi/ripgrep',
  };
}

export function evaluateConfigFinding(
  hasConfigFile: boolean,
  configPathLabel: string | null,
): DoctorFinding {
  return {
    id: 'config',
    ok: true,
    severity: hasConfigFile ? 'ok' : 'warn',
    title: hasConfigFile ? `Config file loaded` : 'No config file (built-in defaults)',
    detail: hasConfigFile
      ? (configPathLabel ?? '(path)')
      : 'Create one with `i18nprune init` or rely on defaults.',
  };
}

export type DoctorPathsInput = {
  sourceLocale: string;
  localesDir: string;
  srcRoot: string;
  pathExists: (p: string) => boolean;
};

export function evaluatePathsFinding(paths: DoctorPathsInput): DoctorFinding {
  const { sourceLocale, localesDir, srcRoot, pathExists } = paths;
  const srcOk = pathExists(sourceLocale);
  const locOk = pathExists(localesDir);
  const rootOk = pathExists(srcRoot);
  const parts: string[] = [];
  if (!srcOk) parts.push(`source locale missing: ${sourceLocale}`);
  if (!locOk) parts.push(`locales dir missing: ${localesDir}`);
  if (!rootOk) parts.push(`src root missing: ${srcRoot}`);
  const err = !srcOk;
  const warn = srcOk && (!locOk || !rootOk);
  const severity: DoctorFinding['severity'] = err ? 'error' : warn ? 'warn' : 'ok';
  const detail = parts.length ? parts.join(' · ') : `${sourceLocale} · ${localesDir} · ${srcRoot}`;
  return {
    id: 'paths',
    ok: parts.length === 0,
    severity,
    title:
      parts.length === 0 ? 'Resolved paths exist on disk' : 'Some resolved paths are missing',
    detail,
  };
}

export function doctorExitCode(findings: DoctorFinding[], strict: boolean): number {
  if (findings.some((f) => f.severity === 'error')) return 1;
  if (strict && findings.some((f) => f.severity === 'warn')) return 1;
  return 0;
}

export type DoctorFindingsInputs = {
  onlyRaw?: string;
  nodeVersion: string;
  rgAvailable: boolean;
  hasConfigFile: boolean;
  configPathLabel: string | null;
  paths: DoctorPathsInput;
};

/**
 * Collect doctor findings from injected environment facts (no filesystem or process access inside).
 */
export function collectDoctorFindingsFromInputs(input: DoctorFindingsInputs): DoctorFinding[] {
  const filter = parseDoctorOnlyList(input.onlyRaw);
  const runners: Record<DoctorCheckId, () => DoctorFinding> = {
    runtime: () => evaluateRuntimeFinding(input.nodeVersion),
    tools: () => evaluateToolsFinding(input.rgAvailable),
    config: () => evaluateConfigFinding(input.hasConfigFile, input.configPathLabel),
    paths: () => evaluatePathsFinding(input.paths),
  };
  const findings: DoctorFinding[] = [];
  for (const id of DOCTOR_CHECK_IDS) {
    if (filter && !filter.has(id)) continue;
    findings.push(runners[id]());
  }
  return findings;
}
