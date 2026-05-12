import { buildConfigSnapshot } from './snapshot.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import { issuesFromDiscoveryWarnings } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';

export function runConfig(ctx: Context): CliJsonEnvelope<'config', ConfigSnapshot> {
  const snap = buildConfigSnapshot(ctx);
  const issues = issuesFromDiscoveryWarnings(ctx.meta.warnings);
  return buildCliJsonEnvelope('config', snap, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}
