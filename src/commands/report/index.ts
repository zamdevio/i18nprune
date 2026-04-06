import { resolveContext } from '@/core/context/index.js';
import { docsCommandUrl } from '@/constants/docs.js';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { canPrintDecorative } from '@/utils/logger/policy.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { formatSectionTitle } from '@/utils/style/section.js';

/**
 * Help-only topic: global **`--report-file`** / **`--report-format`** (see **`utils/report`**).
 * No project writes; loads config so paths match real commands.
 */
export async function runReportHelpTopic(run?: RunOptions): Promise<void> {
  resolveContext();
  const r = run ?? getRunOptions();
  if (!canPrintDecorative(r)) return;

  const url = docsCommandUrl('report');
  logger.primary('', r);
  logger.primary(formatSectionTitle('Report file'), r);
  logger.primary(
    style.dim(
      '  Use global --report-file <path> [--report-format json|text|csv] on supported commands; default format from config.reportFormat or json.',
    ),
    r,
  );
  logger.primary(style.dim(`  Documentation: ${url}`), r);
}
