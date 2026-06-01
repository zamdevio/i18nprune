export type LocaleListRow = {
  code: string;
  localePath: string;
  /** On-disk JSON segments for this locale code (e.g. `app/en.json`, `common/en.json`). */
  segmentCount: number;
  segmentRelativePaths: string[];
  leafCount: number;
  englishIdenticalLeafCount: number | null;
  isSourceLocale: boolean;
};
