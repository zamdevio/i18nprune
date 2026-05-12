import type { ProjectFilesystemRuntime } from '../types/runtime/capabilities.js';
import { readJsonFromRuntimeFsSync } from '../runtime/helpers/sync/index.js';
import { translationSurfacePathValueMap } from '../shared/projects/localeSurfaceMap.js';

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
  return translationSurfacePathValueMap(value);
}

export function buildLocaleListRows(
  runtime: ProjectFilesystemRuntime,
  localesDir: string,
  localeFiles: string[],
  sourceLocalePath: string,
): LocaleListRow[] {
  const { path } = runtime;
  const sourceMap = toLeafMap(readJsonFromRuntimeFsSync(sourceLocalePath, runtime.fs));
  return localeFiles
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const localePath = path.join(localesDir, fileName);
      const localeMap = toLeafMap(readJsonFromRuntimeFsSync(localePath, runtime.fs));
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
