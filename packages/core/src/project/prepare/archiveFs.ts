import type { RuntimePathPort } from '../../types/runtime/path.js';

/** Virtual `/project` filesystem over zip `textFiles` for extraction scans. */
export type ArchiveProjectFs = {
  cwd: string;
  path: RuntimePathPort;
  textFiles: Record<string, string>;
  listFiles: (srcRootPath: string) => string[];
  readFile: (filePath: string) => string;
};

export function createArchiveProjectFs(
  textFiles: Record<string, string>,
  path: RuntimePathPort,
  cwd = '/project',
): ArchiveProjectFs {
  const allPaths = Object.keys(textFiles);
  return {
    cwd,
    path,
    textFiles,
    listFiles(srcRootPath: string) {
      const root = srcRootPath.endsWith('/') ? srcRootPath : `${srcRootPath}/`;
      return allPaths
        .map((p) => path.resolve(cwd, p))
        .filter((abs) => abs === srcRootPath || abs.startsWith(root));
    },
    readFile(filePath: string) {
      const rel = filePath.startsWith(`${cwd}/`) ? filePath.slice(cwd.length + 1) : filePath.replace(/^\//, '');
      const raw = textFiles[rel];
      if (typeof raw !== 'string') throw new Error(`missing file ${filePath}`);
      return raw;
    },
  };
}
