import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { prepareReportFromArchive } from '../fromArchiveReport.js';

function minimalProjectZip(): Uint8Array {
  return zipSync({
    'i18nprune.config.json': strToU8(
      JSON.stringify({
        locales: { source: 'en', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      }),
    ),
    'src/app.ts': strToU8('export const x = () => t("a");'),
    'locales/en.json': strToU8(JSON.stringify({ a: 'A' })),
  });
}

describe('prepareReportFromArchive', () => {
  it('stamps hosted environment metadata (not archive-hosted placeholder)', async () => {
    const zipBytes = minimalProjectZip();
    const hash = crypto.createHash('sha256').update(zipBytes).digest('hex');
    const adapters = createNodeRuntimeAdapters();
    const prepared = await prepareReportFromArchive({
      projectId: 'testpid00000001',
      projectHash: hash,
      zipBytes,
      path: adapters.path,
      prepareHost: 'worker-archive',
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    const project = prepared.document.project as Record<string, unknown>;
    const env = project.environment as Record<string, unknown>;
    expect(env.platform).toBe('cloudflare-workers');
    expect(env.runtimeFamily).toBe('edge-worker');
    expect(env.osRelease).toBe('');
    expect(env.platform).not.toBe('archive-hosted');
  });
});
