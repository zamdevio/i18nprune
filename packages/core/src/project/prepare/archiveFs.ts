import type { RuntimePathPort } from '../../types/runtime/path.js';
import type { ArchiveProjectFs } from '../../types/project/archiveFs.js';
import { toPosixPath } from '../../shared/path/index.js';

function archiveCwdAbsolute(cwd: string, path: RuntimePathPort): string {
  return path.resolve(cwd);
}

/** Zip / textFiles map keys are posix; map an on-disk absolute path under archive `cwd`. */
export function archiveRelativePathFromAbsolute(
  filePath: string,
  cwd: string,
  path: RuntimePathPort,
): string {
  return archiveRelativeKey(filePath, cwd, path);
}

function archiveRelativeKey(filePath: string, cwd: string, path: RuntimePathPort): string {
  const base = archiveCwdAbsolute(cwd, path);
  const abs = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(base, filePath);
  const rel = path.relative(base, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`missing file ${filePath}`);
  }
  return toPosixPath(rel);
}

export function createArchiveProjectFs(
  textFiles: Record<string, string>,
  path: RuntimePathPort,
  cwd = '/project',
): ArchiveProjectFs {
  const allPaths = Object.keys(textFiles);
  const base = archiveCwdAbsolute(cwd, path);
  return {
    cwd,
    path,
    textFiles,
    listFiles(srcRootPath: string) {
      const srcAbs = path.isAbsolute(srcRootPath) ? path.normalize(srcRootPath) : path.resolve(base, srcRootPath);
      return allPaths
        .map((p) => path.resolve(base, p))
        .filter((abs) => {
          const rel = path.relative(srcAbs, abs);
          return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
        });
    },
    readFile(filePath: string) {
      const rel = archiveRelativeKey(filePath, cwd, path);
      const raw = textFiles[rel];
      if (typeof raw !== 'string') throw new Error(`missing file ${filePath}`);
      return raw;
    },
  };
}
