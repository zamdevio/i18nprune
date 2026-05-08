import { buildConfigSnapshot } from './snapshot.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { issuesFromDiscoveryWarnings } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { ConfigSnapshot } from '@/types/commands/config/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

export function runConfig(ctx: Context): CliJsonEnvelope<'config', ConfigSnapshot> {
  const snap = buildConfigSnapshot(ctx);
  const issues = issuesFromDiscoveryWarnings(ctx.meta.warnings);
  return buildCliJsonEnvelope('config', snap, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}
