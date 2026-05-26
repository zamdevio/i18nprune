import { buildConfigSnapshot } from './snapshot.js';
import { buildCliJsonEnvelope } from '@i18nprune/core';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';
import type { CliJsonEnvelope } from '@i18nprune/core';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';

export function runConfig(ctx: Context): CliJsonEnvelope<'config', ConfigSnapshot> {
  const snap = buildConfigSnapshot(ctx);
  const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'config' });
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), readiness ?? []);
  return buildCliJsonEnvelope('config', snap, {
    ok: readiness == null,
    issues,
    cwd: cliEnvelopeCwd(ctx),
  });
}
