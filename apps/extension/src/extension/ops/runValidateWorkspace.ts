import path from 'node:path';
import process from 'node:process';
import {
  buildCliJsonEnvelope,
  createCoreContext,
  issueCodeRepoDocPathForIssueCode,
  resolveSourceLocaleAbsolutePath,
  runValidate as runValidateCore,
  ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
  type CliJsonEnvelope,
  type Issue,
  type RunOptions,
  type ValidateJsonPayload,
} from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { loadWorkspaceI18nConfig } from '../workspace/loadWorkspaceConfig';

type ValidateEnvelope = CliJsonEnvelope<'validate', ValidateJsonPayload>;

function resolveFromRoot(p: string, root: string): string {
  return path.isAbsolute(p) ? p : path.resolve(root, p);
}

function normalizeErr(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function emptyValidateData(): ValidateJsonPayload {
  return {
    missing: [],
    count: 0,
    dynamic: { count: 0, active: 0, commented: 0 },
    keyObservations: { count: 0 },
  };
}

/** Host `RunOptions` for a dashboard run — quiet, no CLI diagnostics. */
const VALIDATE_RUN: RunOptions = {
  json: true,
  jsonPretty: false,
  quiet: false,
  silent: false,
  debugScan: false,
  debugCache: false,
};

function failureEnvelope(cwd: string, issue: Issue): ValidateEnvelope {
  return buildCliJsonEnvelope('validate', emptyValidateData(), {
    ok: false,
    issues: [issue],
    cwd,
  });
}

/**
 * Runs `validate` through core's own {@link runValidateCore} so the dashboard, sidebar, and CLI
 * `validate --json` all share one engine (same payload, issue codes, and source-locale resolution).
 * Only project binding is host-owned: locating the config file and resolving `paths.*`.
 *
 * @param projectRoot Directory that contains or anchors `i18nprune.config.*` (resolved paths use this).
 */
export async function runValidateForProjectRoot(projectRoot: string): Promise<ValidateEnvelope> {
  const adapters = createNodeRuntimeAdapters();
  const { fs, path: pathPort, system } = adapters;

  let config: Awaited<ReturnType<typeof loadWorkspaceI18nConfig>>;
  try {
    config = await loadWorkspaceI18nConfig(projectRoot, adapters);
  } catch (err) {
    return failureEnvelope(projectRoot, {
      severity: 'error',
      code: 'i18nprune.extension.config_load_failed',
      message: normalizeErr(err),
    });
  }

  const { config: merged, projectRoot: cfgRoot } = config;
  const localesDir = resolveFromRoot(merged.locales.directory, cfgRoot);
  const paths = {
    sourceLocale: resolveSourceLocaleAbsolutePath({
      locales: merged.locales,
      directoryAbsolute: localesDir,
      path: pathPort,
      fs,
    }),
    localesDir,
    srcRoot: resolveFromRoot(merged.src, cfgRoot),
  };

  const coreCtx = createCoreContext({
    config: merged,
    adapters,
    env: process.env,
    paths,
    run: VALIDATE_RUN,
  });

  try {
    const out = runValidateCore(coreCtx, {}, {});
    const readFailed = out.issues.some((i) => i.code === ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED);
    return buildCliJsonEnvelope('validate', out.payload, {
      ok: out.payload.missing.length === 0 && !readFailed,
      issues: out.issues,
      cwd: system.cwd(),
    });
  } catch (err) {
    return failureEnvelope(system.cwd(), {
      severity: 'error',
      code: ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
      message: normalizeErr(err),
      path: paths.sourceLocale,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED),
    });
  }
}
