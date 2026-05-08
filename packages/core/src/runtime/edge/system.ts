import type { RuntimeSystemPort } from '../contracts/index.js';

export function createEdgeSystemRuntime(input?: { cwd?: string; now?: () => number }): RuntimeSystemPort {
  return {
    cwd: () => input?.cwd ?? '/',
    now: () => (input?.now ? input.now() : Date.now()),
  };
}
