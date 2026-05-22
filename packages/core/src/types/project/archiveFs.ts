import type { RuntimePathPort } from '../runtime/path.js';

/** Virtual `/project` filesystem over zip `textFiles` for extraction scans. */
export type ArchiveProjectFs = {
  cwd: string;
  path: RuntimePathPort;
  textFiles: Record<string, string>;
  listFiles: (srcRootPath: string) => string[];
  readFile: (filePath: string) => string;
};
