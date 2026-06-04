/** Compatibility graph: bundled Core pins, minimum deps, and reverse incoming edges. */
import { getRelease, getStreamReleases } from '@/features/catalog';
import type { CompatEntry, ReleaseRecordV1, StreamId } from '@/types';

export type CompatEdge = {
  fromStream: StreamId;
  fromVersion: string;
  toStream: StreamId;
  toVersion: string;
  label: 'bundled' | 'depends';
  versionKind: 'exact' | 'minimum';
};

export type OutgoingCompatGroup = {
  toStream: StreamId;
  versions: string[];
  label: 'bundled' | 'depends';
  versionKinds: Map<string, 'exact' | 'minimum'>;
};

/** Short hints shown under the compatibility block (user-facing, not maintainer docs). */
export const COMPAT_MODEL_NOTES = {
  cli: 'Each CLI release bundles one Core version at publish time. Minimum entries are other Core releases it can work with.',
  extension: 'The extension needs a compatible Core release installed in your project.',
} as const;

function resolveCompatVersion(entry: CompatEntry): string | null {
  return entry.version ?? entry.minVersion ?? null;
}

function versionMatchesTarget(edgeVersion: string, targetVersion: string): boolean {
  return edgeVersion === targetVersion;
}

export function edgesFromRelease(release: ReleaseRecordV1): CompatEdge[] {
  if (!release.compat?.length) return [];
  const edges: CompatEdge[] = [];
  for (const entry of release.compat) {
    const toVersion = resolveCompatVersion(entry);
    if (!toVersion) continue;
    edges.push({
      fromStream: release.stream,
      fromVersion: release.version,
      toStream: entry.stream,
      toVersion,
      label: release.stream === 'cli' ? 'bundled' : 'depends',
      versionKind: entry.version ? 'exact' : 'minimum',
    });
  }
  return edges;
}

export function getCompatEdges(): CompatEdge[] {
  const edges: CompatEdge[] = [];
  for (const stream of ['cli', 'extension'] as const) {
    for (const release of getStreamReleases(stream)) {
      edges.push(...edgesFromRelease(release));
    }
  }
  return sortEdges(edges);
}

/** Outgoing: what this release bundles or depends on */
export function getOutgoingEdges(stream: StreamId, version: string): CompatEdge[] {
  const release = getRelease(stream, version);
  if (!release) return [];
  return edgesFromRelease(release);
}

/** Incoming: other releases that pin this stream/version via compat */
export function getIncomingEdges(targetStream: StreamId, targetVersion: string): CompatEdge[] {
  const edges: CompatEdge[] = [];
  for (const stream of ['cli', 'extension'] as const) {
    for (const release of getStreamReleases(stream)) {
      for (const edge of edgesFromRelease(release)) {
        if (
          edge.toStream === targetStream &&
          versionMatchesTarget(edge.toVersion, targetVersion)
        ) {
          edges.push(edge);
        }
      }
    }
  }
  return sortEdges(edges);
}

export type SplitOutgoingCompat = {
  bundled: OutgoingCompatGroup[];
  compatible: OutgoingCompatGroup[];
};

export function getCompatContext(stream: StreamId, version: string) {
  const outgoing = getOutgoingEdges(stream, version);
  const incoming = getIncomingEdges(stream, version);
  const outgoingSplit = splitOutgoingEdges(outgoing);
  return {
    outgoing,
    incoming,
    outgoingSplit,
    incomingBundled: incoming.filter((e) => e.versionKind === 'exact'),
    incomingCompatible: incoming.filter((e) => e.versionKind === 'minimum'),
  };
}

/** Exact pins (shipped/bundled) vs minimum compatible ranges — never mixed in one group. */
export function splitOutgoingEdges(edges: CompatEdge[]): SplitOutgoingCompat {
  return {
    bundled: groupOutgoingEdges(edges.filter((e) => e.versionKind === 'exact')),
    compatible: groupOutgoingEdges(edges.filter((e) => e.versionKind === 'minimum')),
  };
}

/** One row per target stream; versions share the same kind (exact or minimum). */
export function groupOutgoingEdges(edges: CompatEdge[]): OutgoingCompatGroup[] {
  const byTarget = new Map<StreamId, OutgoingCompatGroup>();

  for (const edge of edges) {
    let group = byTarget.get(edge.toStream);
    if (!group) {
      group = {
        toStream: edge.toStream,
        versions: [],
        label: edge.label,
        versionKinds: new Map(),
      };
      byTarget.set(edge.toStream, group);
    }
    if (!group.versions.includes(edge.toVersion)) {
      group.versions.push(edge.toVersion);
      group.versionKinds.set(edge.toVersion, edge.versionKind);
    }
  }

  const groups = [...byTarget.values()];
  for (const group of groups) {
    group.versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }
  return groups.sort((a, b) => a.toStream.localeCompare(b.toStream));
}

function sortEdges(edges: CompatEdge[]): CompatEdge[] {
  return [...edges].sort((a, b) => {
    const streamOrder = a.fromStream.localeCompare(b.fromStream);
    if (streamOrder !== 0) return streamOrder;
    return b.fromVersion.localeCompare(a.fromVersion, undefined, { numeric: true });
  });
}

export function compatNoteForStream(stream: StreamId): string | null {
  if (stream === 'cli') return COMPAT_MODEL_NOTES.cli;
  if (stream === 'extension') return COMPAT_MODEL_NOTES.extension;
  return null;
}
