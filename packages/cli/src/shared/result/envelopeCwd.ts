import type { Context } from '@/types/core/context/index.js';

/** `meta.cwd` for CLI JSON envelopes — prefer resolved workspace cwd from context adapters. */
export function cliEnvelopeCwd(ctx?: Pick<Context, 'adapters'> | null): string {
  return ctx?.adapters.system.cwd() ?? process.cwd();
}
