import { filterLanguages } from '@/shared/languages/index.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import { issuesFromLanguagesFilter, mergeIssues } from '@/shared/result/index.js';
import type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';

export function runLanguages(
  opts: LanguagesCommandOptions,
): CliJsonEnvelope<'languages', ReturnType<typeof filterLanguages>> {
  const rows = filterLanguages(opts.filter);
  const issues = mergeIssues(issuesFromLanguagesFilter(opts.filter, rows.length));
  return buildCliJsonEnvelope('languages', rows, {
    ok: true,
    issues,
    cwd: cliEnvelopeCwd(),
  });
}
