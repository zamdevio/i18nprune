import type { TranslationSurfaceLeaf } from './leaves/translationSurface.js';
import type { LocaleReadDiagnostic } from './read.js';

/** Cached read result for one on-disk locale segment file (absolute path key). */
export type LocaleSegmentReadSnapshot =
  | {
      ok: true;
      absolutePath: string;
      document: unknown;
      leaves: TranslationSurfaceLeaf[];
      text: string;
    }
  | {
      ok: false;
      absolutePath: string;
      diagnostics: LocaleReadDiagnostic[];
    };

/** Merged translation-surface leaves for one locale code (all segments when multi-file). */
export type LocaleCodeReadSnapshot = {
  localeCode: string;
  document: unknown;
  leaves: TranslationSurfaceLeaf[];
};

/**
 * In-memory locale read store for one command / {@link CoreContext} lifetime.
 * Segment entries hold reader output with full {@link TranslationSurfaceLeaf} identity;
 * locale-code entries hold merged leaves for multi-segment layouts.
 */
export type LocaleReadCache = {
  readonly segments: Map<string, LocaleSegmentReadSnapshot>;
  readonly localeCodes: Map<string, LocaleCodeReadSnapshot>;
};
