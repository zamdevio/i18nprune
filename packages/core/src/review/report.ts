import { collectTranslationSurfaceLeaves } from '../shared/localeLeaves/translationSurfaceWalk.js';
import type { ParityPolicy } from '../types/policies/index.js';
import type { ReviewLocaleStats } from '../types/review/index.js';
import { aggregateReviewRows } from './aggregate.js';

function basename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const segs = normalized.split('/');
  return segs[segs.length - 1] ?? normalized;
}

function basenameNoExt(filePath: string): string {
  const name = basename(filePath);
  return name.endsWith('.json') ? name.slice(0, -5) : name;
}

export type BuildReviewJsonDataInput = {
  sourceLocalePath: string;
  localesDir: string;
  dynamicKeySites: number;
  parity?: ParityPolicy;
  sourceLocaleJson: unknown;
  targetLocaleJsonByFile: Readonly<Record<string, unknown>>;
};

export type ReviewJsonDataCore = {
  kind: 'localeReview';
  sourceLocale: string;
  localesDir: string;
  dynamicKeySites: number;
  locales: Record<string, ReviewLocaleStats>;
};

/** Pure review payload builder from already-loaded locale JSON inputs. */
export function buildReviewJsonData(input: BuildReviewJsonDataInput): ReviewJsonDataCore {
  const sourceLeaves = collectTranslationSurfaceLeaves(input.sourceLocaleJson);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));
  const sourceBase = basenameNoExt(input.sourceLocalePath);
  const locales: ReviewJsonDataCore['locales'] = {};

  for (const [file, raw] of Object.entries(input.targetLocaleJsonByFile)) {
    if (file === `${sourceBase}.json`) continue;
    const rows = collectTranslationSurfaceLeaves(raw);
    locales[file] = aggregateReviewRows(rows, sourceMap, input.parity);
  }

  return {
    kind: 'localeReview',
    sourceLocale: sourceBase,
    localesDir: input.localesDir,
    dynamicKeySites: input.dynamicKeySites,
    locales,
  };
}
