import type { CoreContext } from '../../types/context/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ProjectReadinessChecks, ProjectReadinessRequest, ProjectReadinessResult } from '../../types/project/index.js';
import type { RuntimeFsPort } from '../../types/runtime/fs.js';
import {
  ISSUE_PROJECT_CONFIG_FILE_MISSING,
  ISSUE_PROJECT_LOCALES_DIR_UNAVAILABLE,
  ISSUE_PROJECT_SOURCE_LOCALE_UNAVAILABLE,
  ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE,
  ISSUE_PROJECT_LOCALES_STRUCTURE_REQUIRED,
  ISSUE_PROJECT_SOURCE_LOCALE_MISSING_SEGMENTS,
  ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
} from '../../shared/constants/issueCodes.js';
import {
  issueLocalesSourceNotInBundle,
  validateLocalesSourceConfigValue,
} from '../../config/locales/index.js';
import { isLocalesStructureRequired } from '../../shared/locales/layout/requireStructure.js';
import { listLocaleCodesFromContext, listLocaleSegmentsFromContext } from '../../shared/locales/enumerate/fromContext.js';
import { resolveLocalesLayoutFromContext } from '../../shared/locales/layout/resolveLayout.js';
import { collectSourceLocaleMissingSegmentDiagnostics } from '../../shared/locales/diagnostics/index.js';
import { sourceLocaleCodeFromContext } from '../../shared/locales/targets/context.js';
import { normalizeLanguageCode } from '../../shared/languages/normalize.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import { assertSyncPortResult } from '../../runtime/helpers/sync/assert.js';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../../runtime/helpers/sync/index.js';
import { readLocaleBundle } from '../../shared/locales/read/bundle.js';
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

  if (isLocalesStructureRequired(ctx.config.locales)) {
    return null;
  }

  const localeRead = readLocaleBundle({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs,
    path: ctx.adapters.path,
    absoluteFile: path,
  });
  if (!localeRead.ok) {
    const message = localeRead.diagnostics.map((d) => d.message).join(' · ') || 'failed to read source locale JSON';
    return {
      severity: 'error',
      code,
      message,
      path,
      docPath,
    };
  }

  if (requireObject) {
    const v = localeRead.document;
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

function checkLocalesSourceLanguageCode(ctx: CoreContext): Issue | null {
  const validated = validateLocalesSourceConfigValue(ctx.config.locales.source);
  if (!validated.ok) {
    const docPath = issueCodeRepoDocPathForIssueCode(validated.issueCode);
    return {
      severity: 'error',
      code: validated.issueCode,
      message: validated.message,
      docPath,
    };
  }

  if (isLocalesStructureRequired(ctx.config.locales)) {
    return null;
  }

  try {
    const { codes } = listLocaleCodesFromContext(ctx);
    const want = normalizeLanguageCode(validated.code);
    if (!codes.some((c) => normalizeLanguageCode(c) === want)) {
      const bundle = issueLocalesSourceNotInBundle({
        sourceCode: want,
        directory: ctx.config.locales.directory,
        presentCodes: codes,
      });
      const docPath = issueCodeRepoDocPathForIssueCode(bundle.issueCode);
      return {
        severity: 'error',
        code: bundle.issueCode,
        message: bundle.message,
        path: ctx.paths.localesDir,
        docPath,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function checkSourceLocaleMissingSegments(ctx: CoreContext): Issue[] {
  if (isLocalesStructureRequired(ctx.config.locales)) {
    return [];
  }
  try {
    const layout = resolveLocalesLayoutFromContext(ctx);
    const { segments } = listLocaleSegmentsFromContext(ctx);
    const sourceLocale = sourceLocaleCodeFromContext(ctx);
    const diagnostics = collectSourceLocaleMissingSegmentDiagnostics({
      structure: layout.structure,
      segments,
      sourceLocale,
    });
    const docPath = issueCodeRepoDocPathForIssueCode(ISSUE_PROJECT_SOURCE_LOCALE_MISSING_SEGMENTS);
    return diagnostics.map((d) => ({
      severity: 'warning' as const,
      code: ISSUE_PROJECT_SOURCE_LOCALE_MISSING_SEGMENTS,
      message: d.message,
      path: ctx.paths.localesDir,
      docPath,
    }));
  } catch {
    return [];
  }
}

function checkLocalesStructureRequired(ctx: CoreContext): Issue | null {
  if (!isLocalesStructureRequired(ctx.config.locales)) {
    return null;
  }
  const code = ISSUE_PROJECT_LOCALES_STRUCTURE_REQUIRED;
  const docPath = issueCodeRepoDocPathForIssueCode(code);
  return {
    severity: 'error',
    code,
    message:
      'locales.mode is "locale_directory" but locales.structure is missing — set "locale_per_dir" or "feature_bundle" in i18nprune config (layout resolution does not guess structure).',
    path: ctx.paths.localesDir,
    docPath,
  };
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
      c.localesSourceLanguageCode ||
      c.sourceLocaleJsonReadable ||
      c.sourceLocaleJsonObject ||
      c.localesDirectoryAccessible ||
      c.localesStructureRequired ||
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

  if (checks.localesSourceLanguageCode) {
    const sourceLangIssue = checkLocalesSourceLanguageCode(ctx);
    if (sourceLangIssue) issues.push(sourceLangIssue);
  }

  if (checks.localesStructureRequired) {
    const layoutIssue = checkLocalesStructureRequired(ctx);
    if (layoutIssue) issues.push(layoutIssue);
  }

  const srcIssue = checkSourceLocale(ctx, checks, request);
  if (srcIssue) issues.push(srcIssue);

  if (checks.localesSourceLanguageCode) {
    issues.push(...checkSourceLocaleMissingSegments(ctx));
  }

  if (checks.localesDirectoryAccessible) {
    const locIssue = checkLocalesDir(ctx);
    if (locIssue) issues.push(locIssue);
  }

  if (checks.srcRootDirectory) {
    const rootIssue = checkSrcRoot(ctx);
    if (rootIssue) issues.push(rootIssue);
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return { ok: !hasError, issues };
}
