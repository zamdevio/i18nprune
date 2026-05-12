import { filterLanguages } from '@/shared/languages/index.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import {
  issuesFromDiscoveryWarnings,
  issuesFromLanguagesFilter,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';

export function runLanguages(
  ctx: Context,
  opts: LanguagesCommandOptions,
): CliJsonEnvelope<'languages', ReturnType<typeof filterLanguages>> {
  const rows = filterLanguages(opts.filter);
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromLanguagesFilter(opts.filter, rows.length),
  );
  return buildCliJsonEnvelope('languages', rows, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}
