import { computeMissingLiteralKeysFromResolvedKeys } from '@/core/validate/index.js';
import { buildValidateJsonIssues } from '@/core/validate/jsonIssues.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { scanProjectKeyObservations } from '@/core/extractor/keySites/index.js';
import { resolvedKeysFromObservations } from '@/core/extractor/keySites/scan.js';
import { readJsonFile } from '@/utils/fs/index.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/core/result/cliEnvelopeIssues.js';
import { normalizeUnknownError } from '@/core/errors/normalize.js';
import { ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED } from '@/constants/issueCodes.js';
import type { Context } from '@/types/core/context/index.js';
import type { ValidateJsonOutput } from '@/types/command/validate/index.js';
import type { CliJsonEnvelope, Issue } from '@/types/core/json/envelope.js';

function emptyValidateData(): ValidateJsonOutput {
  return {
    missing: [],
    count: 0,
    dynamic: { count: 0, sites: [] },
    keyObservations: { count: 0, observations: [] },
  };
}

function validateEnvelopeFromThrownError(
  ctx: Context,
  err: unknown,
): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  const n = normalizeUnknownError(err);
  const readIssue: Issue = {
    severity: 'error',
    code: ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
    message: n.message,
    path: ctx.paths.sourceLocale,
    docPath: 'json/issue-codes',
  };
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [readIssue]);
  return buildCliJsonEnvelope('validate', emptyValidateData(), {
    ok: false,
    issues,
    cwd: process.cwd(),
  });
}

function runValidateCore(ctx: Context): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  const raw = readJsonFile(ctx.paths.sourceLocale);
  const keyObservations = scanProjectKeyObservations(ctx);
  const resolvedKeys = resolvedKeysFromObservations(keyObservations);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const missing = computeMissingLiteralKeysFromResolvedKeys(raw, resolvedKeys);
  const data: ValidateJsonOutput = {
    missing,
    count: keyObservations.length,
    dynamic: {
      count: dynamicSites.length,
      sites: dynamicSites.slice(0, 200),
    },
    keyObservations: {
      count: keyObservations.length,
      observations: keyObservations.slice(0, 300),
    },
  };
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    buildValidateJsonIssues({
      missing,
      dynamicSiteCount: dynamicSites.length,
      sourceLocalePath: ctx.paths.sourceLocale,
    }),
  );
  const ok = missing.length === 0;
  return buildCliJsonEnvelope('validate', data, {
    ok,
    issues,
    cwd: process.cwd(),
  });
}

/**
 * Same structured result as `validate --json`: full CLI envelope with `ok`, `data`, and `issues[]`.
 * Read/parse failures (missing source locale, invalid JSON, etc.) return **`ok: false`** and an **`issues[]`**
 * entry — they do not throw, so stdout is always one JSON envelope for automation.
 */
export function runValidate(ctx: Context): CliJsonEnvelope<'validate', ValidateJsonOutput> {
  try {
    return runValidateCore(ctx);
  } catch (err: unknown) {
    return validateEnvelopeFromThrownError(ctx, err);
  }
}
