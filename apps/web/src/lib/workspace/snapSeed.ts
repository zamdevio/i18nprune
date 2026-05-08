import { okEnvelope, type ApiEnvelope } from '../services/api/client';
import type { ProjectSnapshot } from '../services/core/projectZip';
import type { WorkspaceSession } from '../../types/workspace';
import { opMemoKey, writeOpMemo } from './opMemo';

/** Curl hints for seeded ops (worker GET paths). */
export type SnapCurls = {
  metadata: string;
  tree: string;
  locales: string;
  doctor: string;
};

/** Warm wsOpMemo for Metadata/Tree/Locales/Doctor from one snapshot envelope (worker-style slice). */
export function seedOpMemoFromSnap(session: WorkspaceSession, snapEnv: ApiEnvelope<unknown>, curls: SnapCurls): void {
  if (!snapEnv.success || snapEnv.data == null) return;
  const raw = snapEnv.data as { projectId?: string; snapshot?: ProjectSnapshot };
  if (!raw.snapshot) return;

  const s = raw.snapshot;
  const projectId = raw.projectId ?? (session.mode === 'remote' ? session.projectId : session.local.projectId);
  const localeJsonByTag = s.localeJsonByTag ?? {};

  const metadataData = {
    projectId,
    projectHash: s.projectHash,
    uploadedAt: s.uploadedAt,
    zipBytes: s.zipBytes,
    fileCount: s.fileCount,
    textFileCount: s.textFileCount,
    detectedConfigPath: s.detectedConfigPath,
    localeTags: Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b)),
    extraction: s.extraction
      ? {
          configHash: s.extraction.configHash,
          sourceLocalePath: s.extraction.sourceLocalePath,
          srcRoot: s.extraction.srcRoot,
          localesDir: s.extraction.localesDir,
          keyObservationsCount: s.extraction.keyObservationsCount,
          dynamicSitesCount: s.extraction.dynamicSitesCount,
          computedAt: s.extraction.computedAt,
        }
      : null,
  };

  const treeData = {
    projectId,
    tree: s.tree,
    stats: {
      fileCount: s.fileCount,
      textFileCount: s.textFileCount,
      zipBytes: s.zipBytes,
    },
  };

  const tags = Object.keys(localeJsonByTag).sort((a, b) => a.localeCompare(b));
  const localesData = {
    projectId,
    sourceLocalePath: s.extraction?.sourceLocalePath ?? null,
    localesDir: s.extraction?.localesDir ?? null,
    locales: tags.map((tag) => ({
      tag,
      isSource: (s.extraction?.sourceLocalePath ?? '').replace(/^.*\//, '').replace(/\.json$/, '') === tag,
    })),
  };

  const extraction = s.extraction;
  const snapshotPresentMessage =
    session.mode === 'remote'
      ? 'Project snapshot exists in Durable Object storage.'
      : 'Project snapshot exists in browser memory.';
  const checks = [
    { id: 'snapshot_present', ok: true, message: snapshotPresentMessage },
    { id: 'resolved_config_present', ok: Boolean(s.resolvedConfig), message: 'Resolved config is available.' },
    { id: 'source_locale_present', ok: Boolean(s.sourceLocaleJson), message: 'Source locale JSON is cached.' },
    { id: 'extraction_present', ok: Boolean(extraction), message: 'Extraction cache is available.' },
    { id: 'locales_cached', ok: tags.length > 0, message: 'Locale JSON map is cached.' },
  ];
  const doctorData = {
    projectId,
    ok: checks.every((x) => x.ok),
    checks,
    stats: {
      fileCount: s.fileCount,
      textFileCount: s.textFileCount,
      localeCount: tags.length,
    },
  };

  writeOpMemo(opMemoKey(session, 'Metadata'), {
    payload: okEnvelope(metadataData),
    title: 'Metadata',
    curl: curls.metadata,
  });
  writeOpMemo(opMemoKey(session, 'Tree'), {
    payload: okEnvelope(treeData),
    title: 'Tree',
    curl: curls.tree,
  });
  writeOpMemo(opMemoKey(session, 'Locales'), {
    payload: okEnvelope(localesData),
    title: 'Locales',
    curl: curls.locales,
  });
  writeOpMemo(opMemoKey(session, 'Doctor'), {
    payload: okEnvelope(doctorData),
    title: 'Doctor',
    curl: curls.doctor,
  });
}
