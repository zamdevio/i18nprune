import { resolveContext } from '@/core/context/index.js';
import { computeMissingLiteralKeysFromResolvedKeys } from '@/core/validate/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { scanProjectKeyObservations } from '@/core/extractor/keySites/index.js';
import { resolvedKeysFromObservations } from '@/core/extractor/keySites/scan.js';
import { readJsonFile } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { stringifyEnvelope } from '@/core/result/cliJson.js';
import { runValidate } from '@/core/programmatic/runValidate.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/core/result/cliEnvelopeIssues.js';
import { buildValidateJsonIssues } from '@/core/validate/jsonIssues.js';
import { logger } from '@/utils/logger/index.js';
import type { ValidateOptions } from '@/types/command/validate/index.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@/constants/issueCodes.js';

function pushValidateReportEntriesFromEnvelope(
  envelope: ReturnType<typeof runValidate>,
): void {
  const { missing, dynamic, keyObservations } = envelope.data;
  const readFailed = envelope.issues.some((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);

  if (readFailed) {
    const first = envelope.issues.find((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);
    pushReportEntry({
      command: 'validate',
      level: 'error',
      message: first?.message ?? 'Could not read source locale JSON',
    });
    return;
  }

  if (missing.length > 0) {
    pushReportEntry({
      command: 'validate',
      level: 'warn',
      message: `${String(missing.length)} key(s) in code missing from source JSON`,
      data: { missing: missing.slice(0, 200) },
    });
  } else {
    pushReportEntry({
      command: 'validate',
      level: 'info',
      message: 'All scanned literal keys exist in source JSON.',
    });
  }
  if (dynamic.count > 0) {
    pushReportEntry({
      command: 'validate',
      level: 'warn',
      message: `${String(dynamic.count)} non-literal translation call site(s) found`,
      data: { dynamic: dynamic.sites.slice(0, 200) },
    });
  }
  pushReportEntry({
    command: 'validate',
    level: 'info',
    message: `${String(keyObservations.count)} key observation(s) extracted`,
    data: { keyObservations: keyObservations.observations.slice(0, 300) },
  });
}

export async function validate(_opts: ValidateOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();

  if (ctx.run.json) {
    const envelope = runValidate(ctx);
    pushValidateReportEntriesFromEnvelope(envelope);
    console.log(stringifyEnvelope(envelope));
    if (!envelope.ok) {
      process.exitCode = 1;
    }
    await finalizeReportFile(ctx.config, {
      command: 'validate',
      ok: envelope.ok,
      durationMs: Date.now() - started,
      counts: {
        missing: envelope.data.missing.length,
        dynamic: envelope.data.dynamic.count,
        keyObservations: envelope.data.keyObservations.count,
      },
    });
    return;
  }

  const raw = readJsonFile(ctx.paths.sourceLocale);
  const keyObservations = scanProjectKeyObservations(ctx);
  const resolvedKeys = resolvedKeysFromObservations(keyObservations);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const missing = computeMissingLiteralKeysFromResolvedKeys(raw, resolvedKeys);
  if (missing.length > 0) {
    pushReportEntry({
      command: 'validate',
      level: 'warn',
      message: `${String(missing.length)} key(s) in code missing from source JSON`,
      data: { missing: missing.slice(0, 200) },
    });
  } else {
    pushReportEntry({
      command: 'validate',
      level: 'info',
      message: 'All scanned literal keys exist in source JSON.',
    });
  }
  if (dynamicSites.length > 0) {
    pushReportEntry({
      command: 'validate',
      level: 'warn',
      message: `${String(dynamicSites.length)} non-literal translation call site(s) found`,
      data: { dynamic: dynamicSites.slice(0, 200) },
    });
  }
  pushReportEntry({
    command: 'validate',
    level: 'info',
    message: `${String(keyObservations.length)} key observation(s) extracted`,
    data: { keyObservations: keyObservations.slice(0, 300) },
  });
  if (dynamicSites.length > 0) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — not validated as static keys:`,
    );
    for (const d of dynamicSites.slice(0, 20)) {
      const loc =
        d.filePath !== undefined && d.line !== undefined ? `${d.filePath}:${String(d.line)} ` : '';
      logger.detail(`  [${d.kind}] ${loc}${d.functionName}: ${d.preview}`);
    }
    if (dynamicSites.length > 20) {
      logger.detail(`  … and ${String(dynamicSites.length - 20)} more`);
    }
  }
  if (missing.length === 0) {
    logger.info('All scanned literal keys exist in source JSON.');
  } else {
    logger.warn(`${String(missing.length)} key(s) in code missing from source JSON:`);
    for (const m of missing.slice(0, 50)) logger.detail(`  ${m}`);
    if (missing.length > 50) logger.detail(`  … and ${String(missing.length - 50)} more`);
  }
  printCommandSummary(
    {
      command: 'validate',
      ok: missing.length === 0,
      durationMs: Date.now() - started,
      counts: { missing: missing.length, dynamic: dynamicSites.length },
      issues: mergeIssues(
        issuesFromDiscoveryWarnings(ctx.meta.warnings),
        buildValidateJsonIssues({
          missing,
          dynamicSiteCount: dynamicSites.length,
          sourceLocalePath: ctx.paths.sourceLocale,
        }),
      ),
    },
    ctx,
  );
  await finalizeReportFile(ctx.config, {
    command: 'validate',
    ok: missing.length === 0,
    durationMs: Date.now() - started,
    counts: {
      missing: missing.length,
      dynamic: dynamicSites.length,
      keyObservations: keyObservations.length,
    },
  });
}
