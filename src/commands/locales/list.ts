import { resolveContext } from '@/core/context/index.js';
import { logger } from '@/utils/logger/index.js';

/**
 * List locale files and counts under `localesDir` — full implementation pending (align with review/validate).
 */
export async function runLocalesList(): Promise<void> {
  const ctx = resolveContext();
  logger.info(
    'locales list — planned: summaries of existing locale JSON under localesDir (see docs/commands/locales).',
    ctx.run,
  );
}
