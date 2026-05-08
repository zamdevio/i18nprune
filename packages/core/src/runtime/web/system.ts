import type { RuntimeSystemPort } from '../contracts/index.js';

export function createWebSystemRuntime(input?: { cwd?: string; now?: () => number }): RuntimeSystemPort {
  return {
    cwd: () => input?.cwd ?? '/',
    now: () => (input?.now ? input.now() : Date.now()),
  };
}
