import type { ProjectStoreRow, ReportStoreRow } from '@i18nprune/core';

export type EvictionCandidate = {
  kind: 'project' | 'report';
  rowKey: string;
  hashKey: string;
  lastAccessedMs: number;
  sizeBytes: number;
};

export function projectRowSizeBytes(row: ProjectStoreRow): number {
  return row.snapshot.zipBytes ?? 0;
}

export function reportRowSizeBytes(row: ReportStoreRow): number {
  return row.byteSize ?? 0;
}

export function rowLastAccessedMs(row: { lastAccessedAt?: string; storedAt?: string }): number {
  const raw = row.lastAccessedAt ?? row.storedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

/** Oldest idle first; among ties delete larger payloads first. */
export function rankEvictionCandidates(candidates: EvictionCandidate[]): EvictionCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.lastAccessedMs !== b.lastAccessedMs) return a.lastAccessedMs - b.lastAccessedMs;
    return b.sizeBytes - a.sizeBytes;
  });
}

export function pickEvictionTargets(
  candidates: EvictionCandidate[],
  fraction: number,
): EvictionCandidate[] {
  if (candidates.length === 0 || fraction <= 0) return [];
  const count = Math.max(1, Math.floor(candidates.length * fraction));
  return rankEvictionCandidates(candidates).slice(0, count);
}
