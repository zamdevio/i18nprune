import type { ProjectReportDocument } from '../../types/index.js';

export type FolderHotspot = {
  folder: string;
  missing: number;
  dynamic: number;
  observations: number;
  weight: number;
};

function folderOfFilePath(filePath: string): string {
  const p = filePath.replace(/\\/g, '/');
  const i = p.lastIndexOf('/');
  if (i <= 0) return '.';
  return p.slice(0, i) || '.';
}

function keyPrefix(key: string): string {
  const i = key.indexOf('.');
  if (i === -1) return key || '(top-level)';
  return key.slice(0, i);
}

/** Roll up counts by parent folder of file paths, or by key prefix when no path exists. */
export function computeFolderHotspots(doc: ProjectReportDocument, topN?: number): FolderHotspot[] {
  const map = new Map<string, { missing: number; dynamic: number; observations: number }>();

  const bump = (folder: string, field: 'missing' | 'dynamic' | 'observations', n = 1): void => {
    const cur = map.get(folder) ?? { missing: 0, dynamic: 0, observations: 0 };
    cur[field] += n;
    map.set(folder, cur);
  };

  for (const k of doc.details.missingKeys) {
    bump(keyPrefix(k), 'missing');
  }

  for (const raw of doc.details.dynamicSites) {
    const r = raw as { filePath?: unknown };
    const fp = typeof r.filePath === 'string' && r.filePath !== '' ? r.filePath : null;
    bump(fp ? folderOfFilePath(fp) : '(unknown)', 'dynamic');
  }

  for (const raw of doc.details.keyObservations) {
    const r = raw as { span?: { filePath?: unknown } };
    const fp =
      r.span && typeof r.span.filePath === 'string' && r.span.filePath !== ''
        ? String(r.span.filePath)
        : null;
    bump(fp ? folderOfFilePath(fp) : '(unknown)', 'observations');
  }

  const rows: FolderHotspot[] = [...map.entries()].map(([folder, c]) => ({
    folder,
    ...c,
    weight: c.missing * 5 + c.dynamic * 2 + c.observations,
  }));

  rows.sort((a, b) => b.weight - a.weight);
  return topN === undefined ? rows : rows.slice(0, topN);
}
