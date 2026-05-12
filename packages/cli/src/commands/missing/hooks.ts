import type { MissingHostHooks } from '@i18nprune/core';

import { resolveDynamicSitesCount, resolveMissingResolvedKeys } from '@/shared/cache/index.js';
import { resolvedLiteralKeysInProject } from '@/shared/validate/missingLiterals.js';
import type { Context } from '@/types/core/context/index.js';
import type { MissingRuntime } from '@/types/command/missing/index.js';

export function buildMissingHostHooks(ctx: Context, runtime: MissingRuntime = {}): MissingHostHooks {
  return {
    emit: runtime.emit,
    runId: runtime.runId,
    loadResolvedKeys: () => resolveMissingResolvedKeys(ctx) ?? resolvedLiteralKeysInProject(ctx),
    getDynamicSitesCount: () => resolveDynamicSitesCount(ctx),
  };
}
