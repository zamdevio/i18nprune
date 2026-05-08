import type { RuntimeSystemPort } from '../contracts/index.js';

export const nodeSystemRuntime: RuntimeSystemPort = {
  cwd: () => process.cwd(),
  now: () => Date.now(),
};
