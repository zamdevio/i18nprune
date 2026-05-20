import { confirm } from '@inquirer/prompts';
import type { ShareHostHooks } from '@i18nprune/core';
import { canAsk } from '@/shared/ask/gate.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { Context } from '@/types/core/context/index.js';
import { createShareWorkerHooks } from './workerHttp.js';
import { randomUUID } from 'node:crypto';

export function buildShareHostHooks(ctx: Context, workerBaseUrl: string): ShareHostHooks {
  const interactive = canAsk(ctx.run) && !getCliYesFlag();
  const worker = createShareWorkerHooks(workerBaseUrl);
  return {
    emit: createCliRunEmitter(ctx.run),
    runId: randomUUID(),
    interactive,
    confirmUpload: interactive
      ? async ({ message, defaultValue }) => confirm({ message, default: defaultValue })
      : undefined,
    ...worker,
  };
}
