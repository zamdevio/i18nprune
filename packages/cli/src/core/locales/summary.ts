import path from 'node:path';
import { collectStringLeaves } from '@/core/json/leaves/index.js';
import { readJsonFile } from '@/utils/fs/index.js';

export type LocaleListRow = {
  code: string;
  localePath: string;
  leafCount: number;
  englishIdenticalLeafCount: number | null;
  isSourceLocale: boolean;
};

function basenameWithoutJson(fileName: string): string {
  return fileName.endsWith('.json') ? fileName.slice(0, -'.json'.length) : fileName;
}

function toLeafMap(value: unknown): Map<string, string> {
  const map = new Map<string, string>();
  for (const leaf of collectStringLeaves(value)) {
    map.set(leaf.path, leaf.value);
  }
  return map;
}

export function buildLocaleListRows(
  localesDir: string,
  localeFiles: string[],
  sourceLocalePath: string,
): LocaleListRow[] {
  const sourceMap = toLeafMap(readJsonFile(sourceLocalePath));
  return localeFiles
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const localePath = path.join(localesDir, fileName);
      const localeMap = toLeafMap(readJsonFile(localePath));
      const isSourceLocale = path.resolve(localePath) === path.resolve(sourceLocalePath);
      let englishIdenticalLeafCount: number | null = null;
      if (!isSourceLocale) {
        let identical = 0;
        for (const [leafPath, value] of localeMap) {
          if (sourceMap.get(leafPath) === value) identical += 1;
        }
        englishIdenticalLeafCount = identical;
      }
      return {
        code: basenameWithoutJson(fileName),
        localePath,
        leafCount: localeMap.size,
        englishIdenticalLeafCount,
        isSourceLocale,
      };
    });
}
