import type { RuntimePathPort } from '../runtime/path.js';

export type ResolveLocaleTargetCodesInput = {
  commandName: string;
  rawTarget: string;
  localeSlugs: string[];
  sourceLocalePath: string;
  path: RuntimePathPort;
};
