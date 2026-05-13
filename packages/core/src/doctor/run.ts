import { existsRuntimeFsSync } from '../runtime/helpers/sync/index.js';
import type { CoreContext } from '../types/generate/index.js';
import type { DoctorHostHooks, DoctorJsonPayload, DoctorRunOptions, DoctorRunResult } from '../types/doctor/index.js';
import { collectDoctorFindingsFromInputs, doctorExitCode } from './findings.js';

/**
 * Core entry for the `doctor` operation.
 *
 * Evaluates project health checks (runtime, tools, config, paths) using host-supplied
 * environment facts and project paths from the context. Returns structured findings,
 * issues, and an exit code — never throws for check failures.
 *
 * @param ctx - Core context providing resolved project paths and filesystem adapters.
 * @param opts - Run options: `only` filters checks, `strict` promotes warnings to errors.
 * @param host - Host-supplied environment facts (Node version, ripgrep, config presence).
 * @returns Structured `{ payload, issues, exitCode }` — `exitCode` is `0` when all
 *          checks pass (or only warn, when `strict` is false).
 *
 * @remarks Pure orchestration: no `process.*` access, no direct filesystem probing.
 * The host passes environment facts via `host`; path existence is checked via `ctx.adapters.fs`.
 *
 * @example
 * ```ts
 * const result = runDoctor(ctx, { strict: false }, {
 *   nodeVersion: process.version,
 *   rgAvailable: true,
 *   hasConfigFile: true,
 *   configPathLabel: 'i18nprune.config.ts',
 * });
 * if (result.exitCode !== 0) process.exit(result.exitCode);
 * ```
 */
export function runDoctor(ctx: CoreContext, opts: DoctorRunOptions, host: DoctorHostHooks): DoctorRunResult {
  const findings = collectDoctorFindingsFromInputs({
    onlyRaw: opts.only,
    nodeVersion: host.nodeVersion,
    rgAvailable: host.rgAvailable,
    hasConfigFile: host.hasConfigFile,
    configPathLabel: host.configPathLabel,
    paths: {
      sourceLocale: ctx.paths.sourceLocale,
      localesDir: ctx.paths.localesDir,
      srcRoot: ctx.paths.srcRoot,
      pathExists: (p) => existsRuntimeFsSync(p, ctx.adapters.fs),
    },
  });

  const strict = Boolean(opts.strict);
  const exitCode = doctorExitCode(findings, strict);

  const payload: DoctorJsonPayload = {
    kind: 'doctor',
    findings,
    strict,
  };

  return { payload, issues: [], exitCode };
}
