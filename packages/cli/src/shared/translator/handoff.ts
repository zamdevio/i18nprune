/**
 * Interactive mid-run rescue picker for **`runGenerate`** (`translate-policy (shipped)` §8).
 *
 * Called from **`GenerateRunHooks.onHandoffPick`** while core holds the translation progress bar
 * in **`pauseClock`** — stderr layout stays consistent with **`shared/cursor`** conventions.
 */

import type { HandoffOffer, TranslationProviderId } from '@i18nprune/core';

import type { RunOptions } from '@i18nprune/core';

import { select } from '@inquirer/prompts';

import { logger } from '@/utils/logger/index.js';
import { duringPrompt } from '@/utils/timer/index.js';

/** @returns Selected catalog id (`null` is unused — callers may treat any id as explicit). */
export async function promptGenerateHandoffPick(
  offer: HandoffOffer,
  run?: RunOptions,
): Promise<TranslationProviderId | null> {
  logger.decorative.dim(
    `  Backend "${offer.failedProviderId}" failed (${offer.translateFailureOutcome ?? offer.failureReason}). Choose a rescue provider.`,
    run,
  );

  const rows = offer.eligibleHandoffRows;
  const defaultId = rows[0]?.id;
  if (defaultId === undefined) return null;

  const picked = await duringPrompt(() =>
    select({
      message: `Rescue provider for target "${offer.target}"`,
      choices: rows.map((r) => ({
        value: r.id,
        name: r.recommended ? `${r.id} (recommended)` : r.id,
      })),
      default: defaultId,
    }),
  );

  return picked;
}
