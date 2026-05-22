import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { prepareProjectSnapshotFromArchive } from '../prepare/fromArchive.js';
import { validateHostedProjectIngestBody } from '../validate/hostedSnapshot.js';
import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';

function minimalProjectZip(): Uint8Array {
  return zipSync({
    'i18nprune.config.json': strToU8(
      JSON.stringify({
        locales: { source: 'locales/en.json', directory: 'locales' },
        src: 'src',
        functions: ['t'],
      }),
    ),
    'src/app.ts': strToU8('export const x = () => t("a");'),
    'locales/en.json': strToU8(JSON.stringify({ a: 'A' })),
  });
}

describe('prepareProjectSnapshotFromArchive', () => {
  it('prepares extraction + locale map from a minimal project zip', async () => {
    const adapters = createNodeRuntimeAdapters();
    const zipBytes = minimalProjectZip();
    const hash = crypto.createHash('sha256').update(zipBytes).digest('hex');

      const out = await prepareProjectSnapshotFromArchive({
        projectId: 'testpid00000001',
        projectHash: hash,
        zipBytes,
        path: adapters.path,
        prepareHost: 'worker-archive',
      });

      expect(out.ok).toBe(true);
      if (!out.ok) return;
      expect(out.parsed.snapshot.extraction?.resolvedKeys.length).toBeGreaterThan(0);
      expect(out.parsed.snapshot.localeJsonByTag.en).toBeDefined();
      expect(out.prepareMeta.extractionMs).toBeGreaterThanOrEqual(0);
      expect(out.prepareMeta.totalMs).toBeGreaterThanOrEqual(out.prepareMeta.extractionMs ?? 0);

      const ingest = validateHostedProjectIngestBody({
        schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
        snapshot: out.parsed.snapshot,
        prepareMeta: out.prepareMeta,
      });
      expect(ingest.ok).toBe(true);
  });
});
