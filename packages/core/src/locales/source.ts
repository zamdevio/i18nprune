import type { RuntimePathPort } from '../types/runtime/path.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { normalizeLanguageCode } from '../shared/languages/normalize.js';

export type SourceLocaleContext = {
  paths: { sourceLocale: string };
  path: RuntimePathPort;
};

/** Basename of the source locale file, normalized (e.g. `en`, `pt-br`). */
export function getSourceLocaleSlug(path: RuntimePathPort, sourceLocalePath: string): string {
  return normalizeLanguageCode(path.basename(sourceLocalePath, '.json'));
}

/** Normalized basename of the configured source locale file (same value used in CLI “source of truth” copy). */
export function getDisplaySourceLocaleCode(ctx: SourceLocaleContext): string {
  return getSourceLocaleSlug(ctx.path, ctx.paths.sourceLocale);
}

/** Styled, plain-string label; CLI can decorate this for terminal output. */
export function buildSourceLocaleTruthLabel(displaySlug: string): string {
  return `(${displaySlug} - source of truth)`;
}

export function isSourceLocaleSlug(
  path: RuntimePathPort,
  candidate: string,
  sourceLocalePath: string,
): boolean {
  return normalizeLanguageCode(candidate) === getSourceLocaleSlug(path, sourceLocalePath);
}

/** Slugs for **target** locales only — excludes the configured source-of-truth locale. */
export function excludeSourceLocaleSlugs(
  path: RuntimePathPort,
  slugs: string[],
  sourceLocalePath: string,
): string[] {
  const n = getSourceLocaleSlug(path, sourceLocalePath);
  return slugs.filter((s) => normalizeLanguageCode(s) !== n);
}

export function assertNotSourceTargetLocale(
  command: string,
  lang: string,
  sourceLocalePath: string,
  ctx: SourceLocaleContext,
): void {
  if (!isSourceLocaleSlug(ctx.path, lang, sourceLocalePath)) return;
  const display = getDisplaySourceLocaleCode(ctx);
  throw new I18nPruneError(
    `${command} does not apply to the source locale ${buildSourceLocaleTruthLabel(display)}. Pass a target language code.`,
    'USAGE',
  );
}
