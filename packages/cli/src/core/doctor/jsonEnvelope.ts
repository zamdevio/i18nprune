import { existsSync } from 'node:fs';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { configExists } from '@/config/load/index.js';
import { configPathForContext } from '@/config/resolve/scan.js';
import { isRipgrepAvailable } from '@/utils/rg/index.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { issuesFromDiscoveryWarnings, issuesFromDoctorFindings, mergeIssues } from '@/core/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type {
  DoctorCheckId,
  DoctorFinding,
  DoctorOptions,
} from '@/types/commands/doctor/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

export const DOCTOR_CHECK_IDS: readonly DoctorCheckId[] = ['runtime', 'tools', 'config', 'paths'];

function parseOnlyList(raw?: string): Set<DoctorCheckId> | null {
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

function nodeMajor(): number {
  const m = /^v(\d+)/.exec(process.version);
  return m ? Number(m[1]) : 0;
}

function runRuntime(): DoctorFinding {
  const major = nodeMajor();
  const ok = major >= 18;
  return {
    id: 'runtime',
    ok,
    severity: ok ? 'ok' : 'error',
    title: `Node.js ${process.version}`,
    detail: ok ? 'Meets engine requirement (>= 18).' : 'Requires Node.js 18 or newer.',
  };
}

function runTools(): DoctorFinding {
  const rg = isRipgrepAvailable();
  return {
    id: 'tools',
    ok: rg,
    severity: rg ? 'ok' : 'warn',
    title: rg ? 'ripgrep (rg) is on PATH' : 'ripgrep (rg) not found on PATH',
    detail: rg
      ? 'Cleanup can use rg for safer reference checks.'
      : 'Install rg for stronger cleanup safety: https://github.com/BurntSushi/ripgrep',
  };
}

function runConfigCheck(): DoctorFinding {
  const hasFile = configExists();
  const p = configPathForContext();
  return {
    id: 'config',
    ok: true,
    severity: hasFile ? 'ok' : 'warn',
    title: hasFile ? `Config file loaded` : 'No config file (built-in defaults)',
    detail: hasFile ? (p ?? '(path)') : 'Create one with `i18nprune init` or rely on defaults.',
  };
}

function runPaths(ctx: Context): DoctorFinding {
  const { sourceLocale, localesDir, srcRoot } = ctx.paths;
  const srcOk = existsSync(sourceLocale);
  const locOk = existsSync(localesDir);
  const rootOk = existsSync(srcRoot);
  const parts: string[] = [];
  if (!srcOk) parts.push(`source locale missing: ${sourceLocale}`);
  if (!locOk) parts.push(`locales dir missing: ${localesDir}`);
  if (!rootOk) parts.push(`src root missing: ${srcRoot}`);
  const err = !srcOk;
  const warn = srcOk && (!locOk || !rootOk);
  const severity: DoctorFinding['severity'] = err ? 'error' : warn ? 'warn' : 'ok';
  let detail = parts.length ? parts.join(' · ') : `${sourceLocale} · ${localesDir} · ${srcRoot}`;
  if (parts.length === 0 && rootOk) {
    const n = scanProjectDynamicKeySites(ctx).length;
    if (n > 0) detail = `${detail} · non-literal translation call site(s): ${String(n)}`;
  }
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

export function collectDoctorFindings(ctx: Context, opts: DoctorOptions): DoctorFinding[] {
  const filter = parseOnlyList(opts.only);
  const runners: Record<DoctorCheckId, () => DoctorFinding> = {
    runtime: runRuntime,
    tools: runTools,
    config: runConfigCheck,
    paths: () => runPaths(ctx),
  };
  const findings: DoctorFinding[] = [];
  for (const id of DOCTOR_CHECK_IDS) {
    if (filter && !filter.has(id)) continue;
    findings.push(runners[id]());
  }
  return findings;
}

export function runDoctor(ctx: Context, opts: DoctorOptions): CliJsonEnvelope<'doctor', DoctorJsonData> {
  const findings = collectDoctorFindings(ctx, opts);
  const strict = Boolean(opts.strict);
  const code = doctorExitCode(findings, strict);
  const data: DoctorJsonData = {
    kind: 'doctor',
    findings,
    strict,
  };
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDoctorFindings(findings),
  );
  return buildCliJsonEnvelope('doctor', data, {
    ok: code === 0,
    issues,
    cwd: process.cwd(),
  });
}

type DoctorJsonData = {
  kind: 'doctor';
  findings: DoctorFinding[];
  strict: boolean;
};
