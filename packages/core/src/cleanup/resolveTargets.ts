import { suggestExistingLocaleTargets } from '../locales/suggestTargetCodes.js';
import { isAllLocaleToken, parseLocaleCodesList } from '../locales/targets.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';
import { sourceLocaleCodeFromContext, targetLocaleCodesFromContext } from '../shared/locales/targets/index.js';
import { segmentsForLocaleCode } from '../shared/locales/targets/index.js';
import type { CleanupSkippedTarget } from '../types/cleanup/index.js';
import type { CoreContext } from '../types/context/index.js';

/** Resolved `--target` selection for cleanup (comma-separated codes or `all`). */
export function resolveCleanupTargetLocaleCodes(
  ctx: CoreContext,
  rawTarget: string,
): { localeCodes: string[]; skippedTargets: CleanupSkippedTarget[] } {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const knownTargets = targetLocaleCodesFromContext(ctx);
  const requested = [
    ...new Set(
      isAllLocaleToken(rawTarget)
        ? knownTargets
        : parseLocaleCodesList(rawTarget).map((code) => normalizeLanguageCode(code)),
    ),
  ];

  const localeCodes: string[] = [];
  const skippedTargets: CleanupSkippedTarget[] = [];

  for (const code of requested) {
    if (code === sourceCode) {
      skippedTargets.push({ localeCode: code, reason: 'source_locale' });
      continue;
    }
    if (segmentsForLocaleCode(ctx, code).length === 0) {
      const suggestions = suggestExistingLocaleTargets(code, knownTargets);
      skippedTargets.push({
        localeCode: code,
        reason: 'not_found',
        ...(suggestions.length > 0 ? { suggestions } : {}),
      });
      continue;
    }
    localeCodes.push(code);
  }

  return { localeCodes, skippedTargets };
}
