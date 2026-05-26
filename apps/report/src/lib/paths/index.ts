import { resolveAbsolutePath } from '../open-in-editor/paths/resolve.js';

export { resolveAbsolutePath } from '../open-in-editor/paths/resolve.js';
export { presentPathForOpen } from '../open-in-editor/paths/present.js';
export { copyPathForFallback } from '../open-in-editor/paths/copyFallback.js';

/** @deprecated Use {@link resolveAbsolutePath} */
export const toAbsolutePath = (cwd: string, filePath: string): string =>
  resolveAbsolutePath(cwd, filePath).absolutePath;
