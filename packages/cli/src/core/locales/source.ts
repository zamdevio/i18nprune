import path from 'node:path';
import { I18nPruneError } from '@/core/errors/index.js';
import { normalizeLanguageCode } from '@/core/languages/index.js';
import type { Context } from '@/types/core/context/index.js';
import { style } from '@/utils/style/index.js';

/** Basename of the source locale file, normalized (e.g. `en`, `pt-br`). */
export function getSourceLocaleSlug(sourceLocalePath: string): string {
  return normalizeLanguageCode(path.basename(sourceLocalePath, '.json'));
}

/**
 * Code shown in messages: optional **`config.sourceLocaleCode`**, else basename of **`source`**.
 */
export function getDisplaySourceLocaleCode(ctx: Pick<Context, 'config' | 'paths'>): string {
  const o = ctx.config.sourceLocaleCode?.trim();
  if (o) return normalizeLanguageCode(o);
  return getSourceLocaleSlug(ctx.paths.sourceLocale);
}

/** Styled `(xx — source of truth)` for errors (accent slug, dim punctuation and label). */
export function buildSourceLocaleTruthLabel(displaySlug: string): string {
  return `${style.dim('(')}${style.accent(displaySlug)}${style.dim(' — source of truth)')}`;
}

export function isSourceLocaleSlug(candidate: string, sourceLocalePath: string): boolean {
  return normalizeLanguageCode(candidate) === getSourceLocaleSlug(sourceLocalePath);
}

/** Slugs for **target** locales only — excludes the configured source-of-truth locale. */
export function excludeSourceLocaleSlugs(slugs: string[], sourceLocalePath: string): string[] {
  const n = getSourceLocaleSlug(sourceLocalePath);
  return slugs.filter((s) => normalizeLanguageCode(s) !== n);
}

export function assertNotSourceTargetLocale(
  command: string,
  lang: string,
  sourceLocalePath: string,
  ctx: Pick<Context, 'config' | 'paths'>,
): void {
  if (!isSourceLocaleSlug(lang, sourceLocalePath)) return;
  const display = getDisplaySourceLocaleCode(ctx);
  throw new I18nPruneError(
    `${command} does not apply to the source locale ${buildSourceLocaleTruthLabel(display)}. Pass a target language code.`,
    'USAGE',
  );
}
