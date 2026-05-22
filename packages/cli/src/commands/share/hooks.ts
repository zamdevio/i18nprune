import type { ShareHostHooks } from '@i18nprune/core';
import { SDK_VERSION } from '@i18nprune/core';
import { canAsk } from '@/shared/ask/gate.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { Context } from '@/types/core/context/index.js';
import { buildReportEnvironmentSnapshot } from '@/commands/report/build.js';
import { CLI_VERSION } from '@/constants/cli.js';
import { confirmShareUpload } from './prompts.js';
import { createShareWorkerHooks } from './worker/http.js';
import { randomUUID } from 'node:crypto';

export function buildShareHostHooks(ctx: Context, workerBaseUrl: string): ShareHostHooks {
  const interactive = canAsk(ctx.run) && !getCliYesFlag() && !ctx.run.json;
  const worker = createShareWorkerHooks(workerBaseUrl, ctx.run);
  return {
    emit: createCliRunEmitter(ctx.run),
    runId: randomUUID(),
    debugCache: ctx.run.debugCache,
    interactive,
    confirmUpload: interactive ? confirmShareUpload : undefined,
    processorContext: {
      surface: 'cli',
      route: 'prepared',
      sdk: 'i18nprune-cli',
      sdkVersion: SDK_VERSION,
      toolVersion: CLI_VERSION,
      environment: buildReportEnvironmentSnapshot(ctx.adapters.fs),
    },
    ...worker,
  };
}
