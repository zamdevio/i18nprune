import { collectTranslationSurfaceLeaves, localeSegmentSourceForFile } from '../shared/locales/leaves/index.js';
import type { ParityPolicy } from '../types/policies/index.js';
import type { LocaleLeafPathApi } from '../types/locales/leaves/segmentSource.js';
import type { ReviewJsonData } from '../types/review/index.js';
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
  /**
   * When set, leaf collection attaches segment `source` for each logical row; review JSON aggregates stay unchanged.
   */
  path?: LocaleLeafPathApi;
};

/** Pure review payload builder from already-loaded locale JSON inputs. */
export function buildReviewJsonData(input: BuildReviewJsonDataInput): ReviewJsonData {
  const pathApi = input.path;
  const sourceOrigin =
    pathApi !== undefined
      ? localeSegmentSourceForFile({
          path: pathApi,
          absoluteFile: input.sourceLocalePath,
          localesDir: input.localesDir,
          structure: 'locale_file',
        }) ?? undefined
      : undefined;
  const sourceLeaves = collectTranslationSurfaceLeaves(input.sourceLocaleJson, '', [], sourceOrigin);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));
  const sourceBase = basenameNoExt(input.sourceLocalePath);
  const locales: ReviewJsonData['locales'] = {};

  for (const [file, raw] of Object.entries(input.targetLocaleJsonByFile)) {
    if (file === `${sourceBase}.json`) continue;
    const targetOrigin =
      pathApi !== undefined
        ? localeSegmentSourceForFile({
            path: pathApi,
            absoluteFile: pathApi.join(input.localesDir, file),
            localesDir: input.localesDir,
            structure: 'locale_file',
          }) ?? undefined
        : undefined;
    const rows = collectTranslationSurfaceLeaves(raw, '', [], targetOrigin);
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
