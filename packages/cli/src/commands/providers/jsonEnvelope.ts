import {
  buildTranslationProvidersPayload,
  type TranslationProvidersListPayload,
} from '@i18nprune/core';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';

export function runProviders(ctx: Context): CliJsonEnvelope<'providers', TranslationProvidersListPayload> {
  const data = buildTranslationProvidersPayload();
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings));
  return buildCliJsonEnvelope('providers', data, {
    ok: true,
    issues,
    cwd: cliEnvelopeCwd(ctx),
  });
}
