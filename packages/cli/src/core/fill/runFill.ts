import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import {
  isLocaleTargetMissingMessage,
  mergeIssues,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
} from '@/core/result/cliEnvelopeIssues.js';
import { ISSUE_FILL_USAGE } from '@/constants/issueCodes.js';
import {
  executeFillWithTargets,
  resolveFillLanguages,
} from '@/core/fill/executeFill.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { FillJsonPayload } from '@/types/command/fill/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { Issue } from '@/types/core/json/envelope.js';

function emptyFillPayload(opts: FillOptions): FillJsonPayload {
  return {
    kind: 'fill',
    dryRun: Boolean(opts.dryRun),
    ...(opts.noMeta === true ? { noMeta: true } : {}),
    targets: [],
    updated: 0,
    sourceLeaves: 0,
    dynamicKeySites: 0,
    targetResults: [],
  };
}

function fillUsageEnvelope(ctx: Context, opts: FillOptions, message: string): CliJsonEnvelope<'fill', FillJsonPayload> {
  const usageIssue: Issue = isLocaleTargetMissingMessage(message)
    ? issuesFromLocaleTargetMissing(message)[0]!
    : {
        severity: 'error',
        code: ISSUE_FILL_USAGE,
        message,
        docPath: 'json/issue-codes',
      };
  return buildCliJsonEnvelope('fill', emptyFillPayload(opts), {
    ok: false,
    issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [usageIssue]),
    cwd: process.cwd(),
  });
}

/** Same workflow as **`fill --json`** (writes unless **`dryRun`**). */
export async function runFill(
  ctx: Context,
  opts: FillOptions,
): Promise<CliJsonEnvelope<'fill', FillJsonPayload>> {
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  try {
    const targets = await resolveFillLanguages(ctx, opts);
    const { payload, issues } = await executeFillWithTargets(ctx, opts, targets, dynamicSites);
    return buildCliJsonEnvelope('fill', payload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
  } catch (err) {
    if (err instanceof I18nPruneError && err.code === 'USAGE') {
      return fillUsageEnvelope(ctx, opts, err.message);
    }
    if (err && typeof err === 'object' && 'issues' in err) {
      const embedded = (err as { issues?: Issue[] }).issues ?? [];
      if (embedded.length > 0) {
        return buildCliJsonEnvelope('fill', emptyFillPayload(opts), {
          ok: false,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
          cwd: process.cwd(),
        });
      }
    }
    return buildIoReadFailureEnvelope('fill', emptyFillPayload(opts), ctx, err);
  }
}
