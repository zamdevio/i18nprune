import type { Context } from '@/types/core/context/index.js';
import type { RuntimePathPort } from '@i18nprune/core';
import { style } from '@/utils/style/index.js';
import {
  assertNotSourceTargetLocale as assertNotSourceTargetLocaleFromCore,
  excludeSourceLocaleSlugs as excludeSourceLocaleSlugsFromCore,
  getDisplaySourceLocaleCode as getDisplaySourceLocaleCodeFromCore,
  getSourceLocaleSlug as getSourceLocaleSlugFromCore,
  isSourceLocaleSlug as isSourceLocaleSlugFromCore,
} from '@i18nprune/core';

/** Basename of the source locale file, normalized (e.g. `en`, `pt-br`). */
export function getSourceLocaleSlug(pathPort: RuntimePathPort, sourceLocalePath: string): string {
  return getSourceLocaleSlugFromCore(pathPort, sourceLocalePath);
}

/** Normalized basename of **`paths.sourceLocale`** (used in CLI copy for “source of truth”). */
export function getDisplaySourceLocaleCode(ctx: Pick<Context, 'paths' | 'adapters'>): string {
  return getDisplaySourceLocaleCodeFromCore({
    paths: ctx.paths,
    path: ctx.adapters.path,
  });
}

/** Styled `(xx — source of truth)` for errors (accent slug, dim punctuation and label). */
export function buildSourceLocaleTruthLabel(displaySlug: string): string {
  return `${style.dim('(')}${style.accent(displaySlug)}${style.dim(' — source of truth)')}`;
}

export function isSourceLocaleSlug(
  candidate: string,
  sourceLocalePath: string,
  ctx: Pick<Context, 'adapters'>,
): boolean {
  return isSourceLocaleSlugFromCore(ctx.adapters.path, candidate, sourceLocalePath);
}

/** Slugs for **target** locales only — excludes the configured source-of-truth locale. */
export function excludeSourceLocaleSlugs(
  slugs: string[],
  sourceLocalePath: string,
  ctx: Pick<Context, 'adapters'>,
): string[] {
  return excludeSourceLocaleSlugsFromCore(ctx.adapters.path, slugs, sourceLocalePath);
}

export function assertNotSourceTargetLocale(
  command: string,
  lang: string,
  sourceLocalePath: string,
  ctx: Pick<Context, 'paths' | 'adapters'>,
): void {
  assertNotSourceTargetLocaleFromCore(command, lang, sourceLocalePath, {
    paths: { sourceLocale: sourceLocalePath },
    path: ctx.adapters.path,
  });
}
