import type { CliErrorCode } from '../../types/errors/index.js';
import type { Issue } from '../../types/json/envelope/index.js';
import { issueCodeRepoDocPathForIssueCode } from '../docs/issueAnchors.js';
import { I18nPruneError } from './internal.js';

export function isErrnoCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === code;
}

export function normalizeUnknownError(
  error: unknown,
  input: {
    when: string;
    defaultCode: CliErrorCode;
    issueCode?: string;
  },
): I18nPruneError {
  if (error instanceof I18nPruneError) return error;
  const extra = input.issueCode !== undefined ? { issueCode: input.issueCode } : undefined;
  if (error instanceof Error) {
    return new I18nPruneError(`${input.when}: ${error.message}`, input.defaultCode, { cause: error, ...extra });
  }
  return new I18nPruneError(`${input.when}: ${String(error)}`, input.defaultCode, { cause: error, ...extra });
}

export function issueFromI18nPruneError(
  error: I18nPruneError,
  input: {
    codeByErrorCode?: Partial<Record<CliErrorCode, string>>;
    fallbackCode: string;
    path?: string;
  },
): Issue {
  const code = error.issueCode ?? input.codeByErrorCode?.[error.code] ?? input.fallbackCode;
  const base: Issue = {
    severity: 'error',
    code,
    message: error.message,
  };
  const withPath = input.path !== undefined ? { ...base, path: input.path } : base;
  if (!code.startsWith('i18nprune.')) return withPath;
  return { ...withPath, docPath: issueCodeRepoDocPathForIssueCode(code) };
}
