import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import { executeGenerate } from '@/core/generate/execute.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload } from '@/types/command/generate/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { mergeIssues, issuesFromDiscoveryWarnings } from '@/core/result/cliEnvelopeIssues.js';

function emptyGeneratePayload(opts: GenerateOptions): GenerateJsonPayload {
  return {
    kind: 'generate',
    dryRun: Boolean(opts.dryRun),
    force: Boolean(opts.force),
    targets: [],
    dynamicKeySites: 0,
    leavesProcessed: 0,
    targetResults: [],
  };
}

/** Same workflow and payload as `generate --json` (writes files unless `dryRun`). */
export async function runGenerate(
  ctx: Context,
  opts: GenerateOptions,
): Promise<CliJsonEnvelope<'generate', GenerateJsonPayload>> {
  const merged = mergeGenerateOptionsFromEnv(opts);
  try {
    const { payload, issues } = await executeGenerate(ctx, merged);
    return buildCliJsonEnvelope('generate', payload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'issues' in err) {
      const embedded = (err as { issues?: Issue[] }).issues ?? [];
      if (embedded.length > 0) {
        return buildCliJsonEnvelope('generate', emptyGeneratePayload(merged), {
          ok: false,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
          cwd: process.cwd(),
        });
      }
    }
    return buildIoReadFailureEnvelope('generate', emptyGeneratePayload(merged), ctx, err);
  }
}
