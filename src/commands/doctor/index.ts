import { existsSync } from 'node:fs';
import { resolveContext } from '@/core/context/index.js';
import { configExists } from '@/config/load/index.js';
import { configPathForContext } from '@/config/resolve/scan.js';
import { printCommandSummary } from '@/core/output/index.js';
import { getRunOptions } from '@/core/runtime/options.js';
import { isRipgrepAvailable } from '@/utils/rg/index.js';
import { logger } from '@/utils/logger/index.js';
import type {
  DoctorCheckId,
  DoctorFinding,
  DoctorOptions,
} from '@/types/commands/doctor/index.js';

export const DOCTOR_CHECK_IDS: readonly DoctorCheckId[] = [
  'runtime',
  'tools',
  'config',
  'paths',
];

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

function runConfig(): DoctorFinding {
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

function runPaths(): DoctorFinding {
  const ctx = resolveContext();
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
  return {
    id: 'paths',
    ok: parts.length === 0,
    severity,
    title:
      parts.length === 0
        ? 'Resolved paths exist on disk'
        : 'Some resolved paths are missing',
    detail: parts.length ? parts.join(' · ') : `${sourceLocale} · ${localesDir} · ${srcRoot}`,
  };
}

export async function runDoctorCommand(opts: DoctorOptions): Promise<void> {
  const started = Date.now();
  const run = getRunOptions();
  const filter = parseOnlyList(opts.only);

  const runners: Record<DoctorCheckId, () => DoctorFinding> = {
    runtime: runRuntime,
    tools: runTools,
    config: runConfig,
    paths: runPaths,
  };

  const findings: DoctorFinding[] = [];
  for (const id of DOCTOR_CHECK_IDS) {
    if (filter && !filter.has(id)) continue;
    findings.push(runners[id]());
  }

  if (run.json) {
    console.log(
      JSON.stringify(
        {
          kind: 'doctor',
          findings,
          strict: Boolean(opts.strict),
        },
        null,
        2,
      ),
    );
    process.exitCode = exitCodeFor(findings, Boolean(opts.strict));
    return;
  }

  if (findings.length === 0) {
    logger.warn('No checks matched --only (use: runtime,tools,config,paths)', run);
  } else {
    logger.info(`doctor: ${String(findings.length)} check(s)`, run);
  }
  for (const f of findings) {
    const msg = `${f.title}${f.detail ? ` — ${f.detail}` : ''}`;
    if (f.severity === 'error') logger.err(msg);
    else if (f.severity === 'warn') logger.warn(msg, run);
    else logger.detail(msg, run);
  }

  const code = exitCodeFor(findings, Boolean(opts.strict));
  printCommandSummary(
    {
      command: 'doctor',
      ok: code === 0,
      durationMs: Date.now() - started,
    },
    { run },
  );

  process.exitCode = code;
}

function exitCodeFor(findings: DoctorFinding[], strict: boolean): number {
  if (findings.some((f) => f.severity === 'error')) return 1;
  if (strict && findings.some((f) => f.severity === 'warn')) return 1;
  return 0;
}
