import type { RuntimePathPort } from '../runtime/path.js';

export type SourceLocaleContext = {
  paths: { sourceLocale: string };
  path: RuntimePathPort;
};
