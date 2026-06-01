import type { RuntimePathPort } from '../runtime/path.js';

export type AssertGenerateTargetCodesInput = {
  commandName: string;
  codes: readonly string[];
  sourceLocalePath: string;
  path: RuntimePathPort;
};
