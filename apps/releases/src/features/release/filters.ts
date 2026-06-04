import type { ReleaseRecordV1 } from '@/types';
import { getSemverType, hasBreaking } from '@/features/catalog/semver';

export type ReleaseFilterId = 'all' | 'breaking' | 'major' | 'minor' | 'patch';

export function filterReleases(
  releases: ReleaseRecordV1[],
  filter: ReleaseFilterId,
): ReleaseRecordV1[] {
  if (filter === 'all') return releases;
  if (filter === 'breaking') return releases.filter(hasBreaking);
  return releases.filter((r) => getSemverType(r.version) === filter);
}
