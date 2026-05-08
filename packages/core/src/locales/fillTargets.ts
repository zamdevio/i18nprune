import type { ProjectFilesystemRuntime } from '../types/runtime/capabilities.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { assertSupportedTargetLanguageCode } from '../shared/languages/validateTargetCode.js';
import { assertNotSourceTargetLocale } from './source.js';
import { isAllLocaleToken, parseLocaleCodesList } from './targets.js';
import { listOtherLocaleCodes } from './otherLocales.js';

export type ResolveFillTargetCodesFromRawInput = {
  commandName: string;
  /** Non-empty selector string (after `pickTargetSelector`), including `all` or comma-separated codes. */
  raw: string;
  localesDir: string;
  sourceLocalePath: string;
  runtime: ProjectFilesystemRuntime;
};

/** All non-source locale files under `localesDir` (normalized codes), or throws if none. */
export function resolveFillAllTargetCodes(
  runtime: ProjectFilesystemRuntime,
  localesDir: string,
  sourceBase: string,
  commandName: string,
): string[] {
  const codes = listOtherLocaleCodes(runtime, localesDir, sourceBase);
  if (codes.length === 0) {
    throw new I18nPruneError(`${commandName}: no target locales to fill (besides source).`, 'USAGE');
  }
  return codes.map((c) => normalizeLanguageCode(c));
}

/**
 * Resolves fill targets from an explicit `--target` string (or interactive pick string).
 * No prompts; callers supply `raw` after optional UI selection.
 */
export function resolveFillTargetCodesFromRaw(input: ResolveFillTargetCodesFromRawInput): string[] {
  const { commandName, raw, localesDir, sourceLocalePath, runtime } = input;
  const sourceBase = runtime.path.basename(sourceLocalePath, '.json');
  const ctx = {
    paths: { sourceLocale: sourceLocalePath },
    path: runtime.path,
  };

  if (isAllLocaleToken(raw)) {
    return resolveFillAllTargetCodes(runtime, localesDir, sourceBase, commandName);
  }
  if (raw.includes(',')) {
    const codes = parseLocaleCodesList(raw);
    for (const c of codes) {
      assertNotSourceTargetLocale(commandName, c, sourceLocalePath, ctx);
      assertSupportedTargetLanguageCode(c);
    }
    return codes;
  }
  const code = normalizeLanguageCode(raw);
  assertNotSourceTargetLocale(commandName, code, sourceLocalePath, ctx);
  assertSupportedTargetLanguageCode(code);
  return [code];
}
