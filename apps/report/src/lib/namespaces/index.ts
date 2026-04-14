import type { ProjectReportDocument } from '../../types/index.js';

export type NamespaceStat = {
  prefix: string;
  missing: number;
  observations: number;
};

function keyPrefix(key: string): string {
  const i = key.indexOf('.');
  if (i === -1) return key || '(top-level)';
  return key.slice(0, i);
}

export function computeNamespaceStats(doc: ProjectReportDocument, topN?: number): NamespaceStat[] {
  const map = new Map<string, { missing: number; observations: number }>();

  for (const k of doc.details.missingKeys) {
    const p = keyPrefix(k);
    const cur = map.get(p) ?? { missing: 0, observations: 0 };
    cur.missing += 1;
    map.set(p, cur);
  }

  for (const raw of doc.details.keyObservations) {
    const r = raw as { resolvedKey?: unknown; raw?: unknown; templateRaw?: unknown };
    const key =
      typeof r.resolvedKey === 'string'
        ? r.resolvedKey
        : typeof r.raw === 'string'
          ? r.raw
          : typeof r.templateRaw === 'string'
            ? r.templateRaw
            : '';
    if (!key) continue;
    const p = keyPrefix(key);
    const cur = map.get(p) ?? { missing: 0, observations: 0 };
    cur.observations += 1;
    map.set(p, cur);
  }

  const rows: NamespaceStat[] = [...map.entries()].map(([prefix, c]) => ({ prefix, ...c }));
  rows.sort((a, b) => b.missing + b.observations - (a.missing + a.observations));
  return topN === undefined ? rows : rows.slice(0, topN);
}
