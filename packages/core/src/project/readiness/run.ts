import type { CoreContext } from '../../types/generate/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ProjectReadinessChecks, ProjectReadinessRequest, ProjectReadinessResult } from '../../types/project/index.js';
import type { RuntimeFsPort } from '../../types/runtime/fs.js';
import {
  ISSUE_PROJECT_CONFIG_FILE_MISSING,
  ISSUE_PROJECT_LOCALES_DIR_UNAVAILABLE,
  ISSUE_PROJECT_SOURCE_LOCALE_UNAVAILABLE,
  ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE,
  ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
} from '../../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import { assertSyncPortResult } from '../../runtime/helpers/sync/assert.js';
import { existsRuntimeFsSync, listRuntimeFsDirSync, readRuntimeFsTextSync } from '../../runtime/helpers/sync/index.js';
import { tryParseJsonText } from '../../shared/json/parse.js';
import { presetUsesValidateSourceIssueCode, resolveProjectReadinessChecks } from './presets.js';

function statKindSync(path: string, fs: RuntimeFsPort) {
  return assertSyncPortResult(fs.statKind(path), 'fs.statKind', path);
}

function checkUserConfigFile(ctx: CoreContext): Issue | null {
  if (ctx.configFileLoaded !== false) return null;
  const code = ISSUE_PROJECT_CONFIG_FILE_MISSING;
  const docPath = issueCodeRepoDocPathForIssueCode(code);
  return {
    severity: 'error',
    code,
    message:
      'No i18nprune.config.* file found in this directory — only built-in defaults (plus env / discovery / CLI overrides) apply. Run `i18nprune init` to create a config file (`--yes` non-interactive; `--rich` for an expanded starter template).',
    docPath,
  };
}

function sourceLocaleIssueCode(request: ProjectReadinessRequest): string {
  if (request.mode === 'preset' && presetUsesValidateSourceIssueCode(request.preset)) {
    return ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED;
  }
  return ISSUE_PROJECT_SOURCE_LOCALE_UNAVAILABLE;
}

function checkSourceLocale(ctx: CoreContext, checks: ProjectReadinessChecks, request: ProjectReadinessRequest): Issue | null {
  const requireObject = Boolean(checks.sourceLocaleJsonObject);
  const requireReadableOnly = Boolean(checks.sourceLocaleJsonReadable) && !requireObject;
  if (!requireObject && !requireReadableOnly) return null;

  const path = ctx.paths.sourceLocale;
  const fs = ctx.adapters.fs;
  const code = sourceLocaleIssueCode(request);
  const docPath = issueCodeRepoDocPathForIssueCode(code);

  if (!existsRuntimeFsSync(path, fs)) {
    return {
      severity: 'error',
      code,
      message: `Source locale file not found: ${path}`,
      path,
      docPath,
    };
  }
  const kind = statKindSync(path, fs);
  if (kind === 'missing' || kind === 'other') {
    return {
      severity: 'error',
      code,
      message: `Source locale path is not available: ${path}`,
      path,
      docPath,
    };
  }
  if (kind !== 'file') {
    return {
      severity: 'error',
      code,
      message: `Source locale path must be a file: ${path}`,
      path,
      docPath,
    };
  }

  let text: string;
  try {
    text = readRuntimeFsTextSync(path, fs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      severity: 'error',
      code,
      message,
      path,
      docPath,
    };
  }

  const parsed = tryParseJsonText(text, { filePath: path, code: 'IO' });
  if (!parsed.ok) {
    return {
      severity: 'error',
      code,
      message: parsed.error.message,
      path,
      docPath,
    };
  }

  if (requireObject) {
    const v = parsed.data;
    if (v === null || typeof v !== 'object' || Array.isArray(v)) {
      return {
        severity: 'error',
        code,
        message: `Source locale JSON must be an object at ${path}`,
        path,
        docPath,
      };
    }
  }

  return null;
}

function checkLocalesDir(ctx: CoreContext): Issue | null {
  const dir = ctx.paths.localesDir;
  const fs = ctx.adapters.fs;
  const code = ISSUE_PROJECT_LOCALES_DIR_UNAVAILABLE;
  const docPath = issueCodeRepoDocPathForIssueCode(code);

  const kind = statKindSync(dir, fs);
  if (kind === 'missing') {
    return {
      severity: 'error',
      code,
      message: `Locales directory not found: ${dir}`,
      path: dir,
      docPath,
    };
  }
  if (kind !== 'directory') {
    return {
      severity: 'error',
      code,
      message: `Locales path must be a directory: ${dir}`,
      path: dir,
      docPath,
    };
  }
  try {
    listRuntimeFsDirSync(dir, fs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      severity: 'error',
      code,
      message: `Cannot read locales directory: ${message}`,
      path: dir,
      docPath,
    };
  }
  return null;
}

function checkSrcRoot(ctx: CoreContext): Issue | null {
  const path = ctx.paths.srcRoot;
  const fs = ctx.adapters.fs;
  const code = ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE;
  const docPath = issueCodeRepoDocPathForIssueCode(code);

  const kind = statKindSync(path, fs);
  if (kind === 'missing') {
    return {
      severity: 'error',
      code,
      message: `Source scan root not found: ${path}`,
      path,
      docPath,
    };
  }
  if (kind !== 'directory') {
    return {
      severity: 'error',
      code,
      message: `Source scan root must be a directory: ${path}`,
      path,
      docPath,
    };
  }
  return null;
}

function hasAnyCheck(c: ProjectReadinessChecks): boolean {
  return Boolean(
    c.configFilePresent ||
      c.sourceLocaleJsonReadable ||
      c.sourceLocaleJsonObject ||
      c.localesDirectoryAccessible ||
      c.srcRootDirectory,
  );
}

/**
 * Run cheap filesystem checks for resolved project paths. Pure: no logging, no `process.*`.
 * Hosts should call this after paths are resolved and before heavy work; keep defensive I/O
 * in ops for mid-run disk failures.
 */
export function runProjectReadiness(ctx: CoreContext, request: ProjectReadinessRequest): ProjectReadinessResult {
  const checks = resolveProjectReadinessChecks(request);
  if (!hasAnyCheck(checks)) {
    return { ok: true, issues: [] };
  }

  const issues: Issue[] = [];

  if (checks.configFilePresent) {
    const cfgIssue = checkUserConfigFile(ctx);
    if (cfgIssue) issues.push(cfgIssue);
  }

  const srcIssue = checkSourceLocale(ctx, checks, request);
  if (srcIssue) issues.push(srcIssue);

  if (checks.localesDirectoryAccessible) {
    const locIssue = checkLocalesDir(ctx);
    if (locIssue) issues.push(locIssue);
  }

  if (checks.srcRootDirectory) {
    const rootIssue = checkSrcRoot(ctx);
    if (rootIssue) issues.push(rootIssue);
  }

  return { ok: issues.length === 0, issues };
}
