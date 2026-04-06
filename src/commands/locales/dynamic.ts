import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/dynamic/index.js';
import { docsCommandUrl } from '@/constants/docs.js';
import { logger } from '@/utils/logger/index.js';
import { style } from '@/utils/style/index.js';
import { canPrintDecorative } from '@/utils/logger/policy.js';
import { getRunOptions } from '@/core/runtime/options.js';
import type { RunOptions } from '@/types/core/runtime/index.js';

/**
 * Read-only: list non-literal translation key sites (heuristic scan). No locale or source writes.
 */
export async function runLocalesDynamic(run?: RunOptions): Promise<void> {
  const ctx = resolveContext();
  const r = run ?? getRunOptions();
  const sites = scanProjectDynamicKeySites(ctx);

  if (!canPrintDecorative(r)) return;

  logger.primary('', r);
  logger.primary(style.bold('  Dynamic key sites (heuristic)'), r);
  logger.primary(
    style.dim(`  Scan root: ${ctx.paths.srcRoot} · ${String(sites.length)} site(s)`),
    r,
  );
  if (sites.length === 0) {
    logger.primary(style.dim('  No non-literal key patterns matched configured translation helpers.'), r);
  } else {
    const cap = 24;
    for (const s of sites.slice(0, cap)) {
      logger.primary(
        style.dim(`  · [${s.kind}] ${s.functionName} — ${s.preview}`),
        r,
      );
    }
    if (sites.length > cap) {
      logger.primary(style.dim(`  … ${String(sites.length - cap)} more (see validate --json)`), r);
    }
  }
  logger.primary(
    style.dim(
      '  Planned: comment-aware multi-language scan, per-key "Commented" labels, and richer paths — see docs.',
    ),
    r,
  );
  logger.primary(style.dim(`  Documentation: ${docsCommandUrl('locales/dynamic')}`), r);
}
