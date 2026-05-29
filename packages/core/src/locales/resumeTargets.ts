import type { CoreContext } from '../types/context/index.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { assertSupportedTargetLanguageCode } from '../shared/languages/validateTargetCode.js';
import { targetLocaleCodesFromContext } from '../shared/locales/targets/index.js';
import { assertNotSourceTargetLocale } from './source.js';
import { isAllLocaleToken, parseLocaleCodesList } from './targets.js';

export type ResolveResumeTargetCodesFromRawInput = {
  commandName: string;
  /** Non-empty selector string (after `pickTargetSelector`), including `all` or comma-separated codes. */
  raw: string;
  ctx: CoreContext;
};

/** All non-source locale codes in the bundle (normalized), or throws if none. */
export function resolveResumeAllTargetCodes(ctx: CoreContext, commandName: string): string[] {
  const codes = targetLocaleCodesFromContext(ctx);
  if (codes.length === 0) {
    throw new I18nPruneError(`${commandName}: no target locale files found in localesDir`, 'USAGE');
  }
  return codes.map((c) => normalizeLanguageCode(c));
}

/**
 * Resolves **`generate --resume`** targets from an explicit **`--target`** string (or interactive pick).
 */
export function resolveResumeTargetCodesFromRaw(input: ResolveResumeTargetCodesFromRawInput): string[] {
  const { commandName, raw, ctx } = input;
  const sourceLocalePath = ctx.paths.sourceLocale;
  const assertCtx = {
    paths: { sourceLocale: sourceLocalePath },
    path: ctx.adapters.path,
  };

  if (isAllLocaleToken(raw)) {
    return resolveResumeAllTargetCodes(ctx, commandName);
  }
  if (raw.includes(',')) {
    const codes = parseLocaleCodesList(raw);
    for (const c of codes) {
      assertNotSourceTargetLocale(commandName, c, sourceLocalePath, assertCtx);
      assertSupportedTargetLanguageCode(c);
    }
    return codes;
  }
  const code = normalizeLanguageCode(raw);
  assertNotSourceTargetLocale(commandName, code, sourceLocalePath, assertCtx);
  assertSupportedTargetLanguageCode(code);
  return [code];
}
