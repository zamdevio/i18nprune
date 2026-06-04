/** Bundled release catalog (generated from `content/` → `src/data/releases.json`). */
import catalogJson from '../../data/releases.json';
import type { ReleaseCatalogV1, ReleaseRecordV1, StreamId } from '@/types';
import { STREAM_IDS } from './streams';

const catalog = catalogJson as ReleaseCatalogV1;

export function getCatalog(): ReleaseCatalogV1 {
  return catalog;
}

export function getStreamReleases(streamId: StreamId): ReleaseRecordV1[] {
  const stream = catalog.streams[streamId];
  if (!stream) return [];
  return stream.versions.map((v) => stream.releases[v]).filter(Boolean);
}

export function getRelease(streamId: StreamId, version: string): ReleaseRecordV1 | null {
  const stream = catalog.streams[streamId];
  if (!stream) return null;
  return stream.releases[version] ?? null;
}

export function getLatestRelease(streamId: StreamId): ReleaseRecordV1 | null {
  const stream = catalog.streams[streamId];
  if (!stream?.latest) return null;
  return stream.releases[stream.latest] ?? null;
}

export function getCombinedTimeline(): ReleaseRecordV1[] {
  const all: ReleaseRecordV1[] = [];
  for (const streamId of STREAM_IDS) {
    all.push(...getStreamReleases(streamId));
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
