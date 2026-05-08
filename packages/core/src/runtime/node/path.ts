import path from 'node:path';
import type { RuntimePathPort } from '../contracts/index.js';

export const nodePathRuntime: RuntimePathPort = {
  join: (...parts) => path.join(...parts),
  dirname: (value) => path.dirname(value),
  basename: (value, ext) => path.basename(value, ext),
  normalize: (value) => path.normalize(value),
  relative: (from, to) => path.relative(from, to),
  resolve: (...parts) => path.resolve(...parts),
  isAbsolute: (value) => path.isAbsolute(value),
};
