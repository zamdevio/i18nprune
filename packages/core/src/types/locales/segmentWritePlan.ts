import type { ResolvedLocalesLayout } from './layout.js';

/** Role of a segment in a read/write plan. */
export type LocaleSegmentWriteRole = 'source' | 'target' | 'existing_target';

/**
 * One on-disk JSON segment under the configured locales directory.
 *
 * @remarks `relativePath` is bundle-root–relative (`en.json`, `en/auth.json`, `auth/en.json`).
 */
export type LocaleSegmentWriteTarget = {
  locale: string;
  relativePath: string;
  absolutePath: string;
  role: LocaleSegmentWriteRole;
};

/** How generate (or future sync bootstrap) writes one logical target locale. */
export type LocaleSegmentWritePlan = {
  targetLocale: string;
  layout: ResolvedLocalesLayout;
  /** Segments to read/write for this target (PR 1: one derived or one existing primary). */
  segments: LocaleSegmentWriteTarget[];
  /** Planned segments not yet on disk (subset of `segments`). */
  missingSegments: LocaleSegmentWriteTarget[];
};
