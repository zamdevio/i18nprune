import {
  ISSUE_CONFIG_INVALID,
  ISSUE_CONFIG_LOAD_FAILED,
  ISSUE_CONFIG_MISSING,
} from '../../shared/constants/issueCodes.js';
import { RESULT_API_VERSION } from '../../shared/constants/result.js';
import {
  I18nPruneError,
  isErrnoCode,
  issueFromI18nPruneError,
  normalizeUnknownError,
} from '../../shared/errors/index.js';
import type { Issue, Result } from '../../types/json/envelope/index.js';
import type { ConfigPathSystemRuntime } from '../../types/runtime/capabilities.js';
import type { CoreConfigInput, CoreConfigResolved, ResolveCoreConfigOptions } from '../../types/config/index.js';
import { parseJsonText } from '../../shared/json/parse.js';
import { resolveCoreConfig } from './core.js';

type ParseConfigText = (text: string, configPath: string) => unknown | Promise<unknown>;

export type LoadCoreConfigFromPathInput = {
  configPath: string;
  readText: (configPath: string) => string | Promise<string>;
  parseText?: ParseConfigText;
  resolveOptions?: ResolveCoreConfigOptions;
  runtime?: ConfigPathSystemRuntime;
};

function normalizeLoadError(configPath: string, error: unknown): I18nPruneError {
  if (isErrnoCode(error, 'ENOENT')) {
    return new I18nPruneError(`Config file not found: ${configPath}`, 'CONFIG_MISSING', {
      cause: error,
      issueCode: ISSUE_CONFIG_MISSING,
    });
  }
  if (error instanceof SyntaxError) {
    return new I18nPruneError(`Config parse failed at ${configPath}: ${error.message}`, 'CONFIG_INVALID', {
      cause: error,
      issueCode: ISSUE_CONFIG_INVALID,
    });
  }
  return normalizeUnknownError(error, {
    when: `Config load failed at ${configPath}`,
    defaultCode: 'IO',
    issueCode: ISSUE_CONFIG_LOAD_FAILED,
  });
}

function issueFromI18nError(error: I18nPruneError, configPath: string): Issue {
  return issueFromI18nPruneError(error, {
    codeByErrorCode: {
      CONFIG_MISSING: 'i18nprune.config.missing',
      CONFIG_INVALID: 'i18nprune.config.invalid',
    },
    fallbackCode: 'i18nprune.config.load_failed',
    path: configPath,
  });
}

/** Load + parse + resolve core config from a given path using host-provided I/O. */
export async function loadCoreConfigFromPath(input: LoadCoreConfigFromPathInput): Promise<CoreConfigResolved> {
  const parseText: ParseConfigText =
    input.parseText ??
    ((text: string, configPath: string) =>
      parseJsonText(text, {
        filePath: configPath,
        code: 'CONFIG_INVALID',
        issueCode: ISSUE_CONFIG_INVALID,
      }));
  const cwd = input.runtime?.system?.cwd();
  const effectivePath =
    cwd && input.runtime?.path && !input.runtime.path.isAbsolute(input.configPath)
      ? input.runtime.path.resolve(cwd, input.configPath)
      : input.configPath;
  try {
    const text = await input.readText(effectivePath);
    const parsed = await parseText(text, effectivePath);
    const asInput = typeof parsed === 'object' && parsed !== null ? (parsed as CoreConfigInput) : {};
    return resolveCoreConfig(asInput, input.resolveOptions);
  } catch (error) {
    throw normalizeLoadError(effectivePath, error);
  }
}

/**
 * Non-throwing helper for clients that prefer Result envelopes over exceptions.
 */
export async function tryLoadCoreConfigFromPath(
  input: LoadCoreConfigFromPathInput,
  cwd = input.runtime?.system?.cwd() ?? '',
): Promise<Result<'core.config', CoreConfigResolved>> {
  try {
    const data = await loadCoreConfigFromPath(input);
    return {
      ok: true,
      kind: 'core.config',
      data,
      issues: [],
      meta: { apiVersion: RESULT_API_VERSION, cwd },
    };
  } catch (error) {
    const normalized = error instanceof I18nPruneError ? error : normalizeLoadError(input.configPath, error);
    return {
      ok: false,
      kind: 'failed',
      issues: [issueFromI18nError(normalized, input.configPath)],
      meta: { apiVersion: RESULT_API_VERSION, cwd },
    };
  }
}
