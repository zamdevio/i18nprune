import { buildTranslationProvidersPayload } from '@i18nprune/core';
import { resolveContext } from '@/shared/context/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { runProviders } from '@/commands/providers/jsonEnvelope.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDecorative, canPrintPrimary } from '@/utils/logger/policy.js';
import { style } from '@/utils/style/index.js';
import type { ProvidersCommandOptions } from '@/types/commands/providers/index.js';

async function printHumanProviders(): Promise<void> {
  const { providers, mergePrecedence, configSnippets } = buildTranslationProvidersPayload();
  const ctx = await resolveContext();
  const run = ctx.run;

  if (canPrintDecorative(run)) {
    logger.decorative.dim('  Merge / precedence', run);
    logger.decorative.blank(run);
  }
  if (canPrintPrimary(run)) {
    logger.primary(`  ${mergePrecedence}`, run);
    logger.primary('', run);
  }

  for (const p of providers) {
    if (canPrintPrimary(run)) {
      logger.primary(style.bold(style.accent(`${p.id}`)) + style.dim(` · ${p.kind}`), run);
      logger.primary(`    ${p.label}`, run);
      logger.primary(style.dim('    Config example:') + ` ${configSnippets[p.id]}`, run);
      if (p.envVars.length > 0) {
        logger.primary(style.dim('    Env vars:'), run);
        for (const ev of p.envVars) {
          const req = ev.required ? 'required' : 'optional';
          logger.primary(`      ${ev.key} (${req}) — ${ev.description}`, run);
        }
      } else {
        logger.primary(style.dim('    Env vars:') + ' (none)', run);
      }
      if (p.configKeys && p.configKeys.length > 0) {
        logger.primary(style.dim('    Config keys:'), run);
        for (const ck of p.configKeys) {
          const opt = ck.optional ? 'optional' : 'required';
          logger.primary(`      ${ck.key} (${opt}) — ${ck.description}`, run);
        }
      }
      logger.primary('', run);
    }
  }

  if (canPrintDecorative(run)) {
    logger.decorative.dim('  Docs: config/translate · config/env · commands/generate · commands/fill', run);
    logger.decorative.blank(run);
  }
}

export async function providers(opts: ProvidersCommandOptions = {}): Promise<void> {
  void opts;
  const ctx = await resolveContext();

  if (ctx.run.json) {
    const envelope = runProviders(ctx);
    console.log(stringifyEnvelope(envelope));
    return;
  }

  await printHumanProviders();
}
