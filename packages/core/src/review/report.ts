import { collectTranslationSurfaceLeaves, localeSegmentSourceForFile } from '../shared/locales/leaves/index.js';
import type { LocalesLayoutStructure } from '../types/locales/layout.js';
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
  dynamicKeySitesActive: number;
  dynamicKeySitesCommented: number;
  parity?: ParityPolicy;
  sourceLocaleJson: unknown;
  targetLocaleJsonByFile: Readonly<Record<string, unknown>>;
  /** When set, each target file is compared to its paired source segment instead of the primary source file. */
  pairedSourceLocaleJsonByTargetFile?: Readonly<Record<string, unknown>>;
  /**
   * When set, leaf collection attaches segment `fileOrigin` for each logical row; review JSON aggregates stay unchanged.
   */
  path?: LocaleLeafPathApi;
  layoutStructure?: LocalesLayoutStructure;
};

/** Pure review payload builder from already-loaded locale JSON inputs. */
export function buildReviewJsonData(input: BuildReviewJsonDataInput): ReviewJsonData {
  const pathApi = input.path;
  const layoutStructure = input.layoutStructure ?? 'locale_file';
  const sourceOrigin =
    pathApi !== undefined
      ? localeSegmentSourceForFile({
          path: pathApi,
          absoluteFile: input.sourceLocalePath,
          localesDir: input.localesDir,
          structure: layoutStructure,
        }) ?? undefined
      : undefined;
  const defaultSourceLeaves = collectTranslationSurfaceLeaves(input.sourceLocaleJson, '', [], sourceOrigin);
  const defaultSourceMap = new Map(defaultSourceLeaves.map((l) => [l.path, l.value]));
  /**
   * Locale **code** for the reported source locale. `basenameNoExt` is only correct for `locale_file`
   * layouts (`locales/en.json` → `en`); under `locale_per_dir` it yields the *segment* name
   * (`locales/en/about.json` → `about`). Prefer the layout-aware resolution when a path API is available.
   */
  const sourceLocale = sourceOrigin?.locale ?? basenameNoExt(input.sourceLocalePath);
  /** Filename key used to skip the source segment inside target maps (`en.json`, `about.json`). */
  const sourceFileKey = `${basenameNoExt(input.sourceLocalePath)}.json`;
  const locales: ReviewJsonData['locales'] = {};

  for (const [file, raw] of Object.entries(input.targetLocaleJsonByFile)) {
    if (file === sourceFileKey) continue;
    const pairedSourceJson = input.pairedSourceLocaleJsonByTargetFile?.[file];
    const sourceMap =
      pairedSourceJson !== undefined
        ? new Map(
            collectTranslationSurfaceLeaves(pairedSourceJson).map((leaf) => [leaf.path, leaf.value] as const),
          )
        : defaultSourceMap;
    const targetOrigin =
      pathApi !== undefined
        ? localeSegmentSourceForFile({
            path: pathApi,
            absoluteFile: pathApi.join(input.localesDir, file),
            localesDir: input.localesDir,
            structure: layoutStructure,
          }) ?? undefined
        : undefined;
    const rows = collectTranslationSurfaceLeaves(raw, '', [], targetOrigin);
    locales[file] = aggregateReviewRows(rows, sourceMap, input.parity);
  }

  return {
    kind: 'localeReview',
    sourceLocale,
    localesDir: input.localesDir,
    dynamicKeySites: input.dynamicKeySites,
    dynamicKeySitesActive: input.dynamicKeySitesActive,
    dynamicKeySitesCommented: input.dynamicKeySitesCommented,
    locales,
  };
}
