import type { RuntimeSystemPort } from '../contracts/index.js';

export function createRuntimeSystemPort(input: RuntimeSystemPort): RuntimeSystemPort {
  return {
    cwd: input.cwd,
    now: input.now,
  };
}
