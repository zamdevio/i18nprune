import { select } from '@inquirer/prompts';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { logger } from '@/utils/logger/index.js';
import { ALL_LANG_TOKEN } from '@/utils/cli/args.js';
import { listOtherLocaleCodes } from '@/core/locales/otherLocales.js';

/** Interactive **`fill`**: one locale or **`all`** target locales (non-source `*.json` under **`localesDir`**). */
export async function promptFillLanguageSelection(
  localesDir: string,
  sourceBase: string,
  run?: RunOptions,
): Promise<string> {
  const codes = listOtherLocaleCodes(localesDir, sourceBase);
  logger.decorative.dim('  Choose one target locale or all non-source locales.', run);
  if (codes.length === 0) {
    throw new I18nPruneError('No target locale JSON files found under localesDir.', 'USAGE');
  }
  return select({
    message: 'Target locale(s)',
    choices: [
      { name: `All target locales (${String(codes.length)})`, value: ALL_LANG_TOKEN },
      ...codes.map((c) => ({ name: c, value: c })),
    ],
  });
}
