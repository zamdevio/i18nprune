import path from 'node:path';
import {
  buildCliJsonEnvelope,
  buildValidateIssues,
  buildValidateScanPayload,
  extractor,
  issueCodeRepoDocPathForIssueCode,
  readJsonFromRuntimeFsSync,
  ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
  type CliJsonEnvelope,
  type CoreEngineRuntime,
  type Issue,
} from '@i18nprune/core';
import type { ValidateScanPayload } from '@i18nprune/core/validate';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { loadWorkspaceI18nConfig } from '../workspace/loadWorkspaceConfig';

type ValidateEnvelope = CliJsonEnvelope<'validate', ValidateScanPayload>;

function resolveFromRoot(p: string, root: string): string {
  return path.isAbsolute(p) ? p : path.resolve(root, p);
}

function normalizeErr(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function emptyValidateData(): ValidateScanPayload {
  return {
    missing: [],
    count: 0,
    dynamic: { count: 0 },
    keyObservations: { count: 0 },
  };
}

/**
 * Runs the same validate scan as the CLI `validate --json` path, using only `@i18nprune/core`
 * (CLI's `runValidate` is not exported from core — this mirrors its happy path).
 */
/** @param projectRoot Directory that contains or anchors `i18nprune.config.*` (resolved paths use this). */
export async function runValidateForProjectRoot(projectRoot: string): Promise<ValidateEnvelope> {
  const adapters = createNodeRuntimeAdapters();
  const { fs, path: pathPort, system } = adapters;
  const cwd = projectRoot;

  let config: Awaited<ReturnType<typeof loadWorkspaceI18nConfig>>;
  try {
    config = await loadWorkspaceI18nConfig(projectRoot, adapters);
  } catch (err) {
    const issue: Issue = {
      severity: 'error',
      code: 'i18nprune.extension.config_load_failed',
      message: normalizeErr(err),
    };
    return buildCliJsonEnvelope('validate', emptyValidateData(), {
      ok: false,
      issues: [issue],
      cwd,
    });
  }

  try {
    const { config: merged, projectRoot } = config;
    const paths = {
      sourceLocale: resolveFromRoot(merged.source, projectRoot),
      srcRoot: resolveFromRoot(merged.src, projectRoot),
    };

    const runtime: CoreEngineRuntime = { fs, path: pathPort, system };
    const scanInput = {
      srcRoot: paths.srcRoot,
      functions: merged.functions,
      runtime,
      exclude: merged.exclude,
    };

    const raw = readJsonFromRuntimeFsSync(paths.sourceLocale, fs);
    const keyObservations = extractor.keySites.scanProjectKeyObservations(scanInput);
    const resolvedKeys = extractor.keySites.resolvedKeysFromObservations(keyObservations);
    const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);
    const data = buildValidateScanPayload({
      sourceLocaleJson: raw,
      resolvedKeys,
      keyObservations,
      dynamicSites,
    });
    const issues = buildValidateIssues({
      missingCount: data.missing.length,
      dynamicSiteCount: dynamicSites.length,
      sourceLocalePath: paths.sourceLocale,
    });
    const ok = data.missing.length === 0;
    return buildCliJsonEnvelope('validate', data, { ok, issues, cwd });
  } catch (err) {
    const readIssue: Issue = {
      severity: 'error',
      code: ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
      message: normalizeErr(err),
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED),
    };
    return buildCliJsonEnvelope('validate', emptyValidateData(), {
      ok: false,
      issues: [readIssue],
      cwd,
    });
  }
}
