import { resolveAbsolutePath } from '../open-in-editor/paths/resolve.js';

export { resolveAbsolutePath };

/** @deprecated Use {@link resolveAbsolutePath} */
export const toAbsolutePath = (cwd: string, filePath: string): string =>
  resolveAbsolutePath(cwd, filePath).absolutePath;
