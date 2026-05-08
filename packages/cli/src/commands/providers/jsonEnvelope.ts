import {
  buildTranslationProvidersPayload,
  type TranslationProvidersListPayload,
} from '@i18nprune/core';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

export function runProviders(ctx: Context): CliJsonEnvelope<'providers', TranslationProvidersListPayload> {
  const data = buildTranslationProvidersPayload();
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings));
  return buildCliJsonEnvelope('providers', data, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}
