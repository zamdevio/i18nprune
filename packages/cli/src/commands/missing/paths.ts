import { resolvedLiteralKeysInProject } from '@/shared/validate/missingLiterals.js';
import type { Context } from '@/types/core/context/index.js';
import { resolveMissingPathsPlan } from '@i18nprune/core';

/** Paths to add as empty strings in target locale JSON based on current code scan. */
export function resolvePathsToAddForMissing(
  ctx: Context,
  localeJson: unknown,
  options?: { resolvedKeys?: ReadonlySet<string> },
): { toAdd: string[]; skippedNotInScan: string[] } {
  const resolvedKeys = options?.resolvedKeys ?? resolvedLiteralKeysInProject(ctx);

  return resolveMissingPathsPlan({
    localeJson,
    resolvedKeys,
  });
}
