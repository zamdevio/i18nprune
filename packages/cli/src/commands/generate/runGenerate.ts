import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import { safeTranslationMetaForEnvelope } from '@/shared/translation/resolveProvider.js';
import { executeGenerate } from './execute.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload } from '@/types/command/generate/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { Issue } from '@/types/core/json/envelope.js';
import {
  mergeIssues,
  issuesFromDiscoveryWarnings,
  usageIssueFromI18nPruneError,
} from '@/shared/result/cliEnvelopeIssues.js';
import { ISSUE_GENERATE_USAGE } from '@/constants/issueCodes.js';
import { I18nPruneError, emitIssuesAsRunErrors, emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';

function emptyGeneratePayload(ctx: Context, opts: GenerateOptions): GenerateJsonPayload {
  return {
    kind: 'generate',
    ...safeTranslationMetaForEnvelope(ctx, opts.provider),
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
  runtime?: { emit?: RunEmitter; runId?: string },
): Promise<CliJsonEnvelope<'generate', GenerateJsonPayload>> {
  const merged = mergeGenerateOptionsFromEnv(opts);
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'generate', runId: runtime?.runId, at: nowMs() });
  try {
    const { payload, issues } = await executeGenerate(ctx, merged, runtime);
    const envelope = buildCliJsonEnvelope('generate', payload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'generate',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'generate',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        targets: payload.targets.length,
        leaves: payload.leavesProcessed,
        dynamicKeySites: payload.dynamicKeySites,
      },
    });
    return envelope;
  } catch (err) {
    if (err instanceof I18nPruneError && err.code === 'USAGE') {
      const usageIssue = usageIssueFromI18nPruneError(err, ISSUE_GENERATE_USAGE);
      const envelope = buildCliJsonEnvelope('generate', emptyGeneratePayload(ctx, merged), {
        ok: false,
        issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [usageIssue]),
        cwd: process.cwd(),
      });
      emitIssuesAsRunErrors(runtime?.emit, {
        op: 'generate',
        runId: runtime?.runId,
        issues: envelope.issues,
        recoverable: true,
      });
      emitRunEvent(runtime?.emit, {
        type: 'run.completed',
        op: 'generate',
        runId: runtime?.runId,
        at: nowMs(),
        ok: envelope.ok,
      });
      emitRunEvent(runtime?.emit, {
        type: 'run.summary',
        op: 'generate',
        runId: runtime?.runId,
        at: nowMs(),
        ok: envelope.ok,
        issueCount: envelope.issues.length,
        counts: { targets: 0, leaves: 0, dynamicKeySites: 0 },
      });
      return envelope;
    }
    if (err && typeof err === 'object' && 'issues' in err) {
      const embedded = (err as { issues?: Issue[] }).issues ?? [];
      if (embedded.length > 0) {
        emitIssuesAsRunErrors(runtime?.emit, {
          op: 'generate',
          runId: runtime?.runId,
          issues: embedded,
          recoverable: true,
        });
        const envelope = buildCliJsonEnvelope('generate', emptyGeneratePayload(ctx, merged), {
          ok: false,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
          cwd: process.cwd(),
        });
        emitRunEvent(runtime?.emit, {
          type: 'run.completed',
          op: 'generate',
          runId: runtime?.runId,
          at: nowMs(),
          ok: envelope.ok,
        });
        emitRunEvent(runtime?.emit, {
          type: 'run.summary',
          op: 'generate',
          runId: runtime?.runId,
          at: nowMs(),
          ok: envelope.ok,
          issueCount: envelope.issues.length,
          counts: { targets: 0, leaves: 0, dynamicKeySites: 0 },
        });
        return envelope;
      }
    }
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'generate',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.generate_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'generate',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    return buildIoReadFailureEnvelope('generate', emptyGeneratePayload(ctx, merged), ctx, err);
  }
}
