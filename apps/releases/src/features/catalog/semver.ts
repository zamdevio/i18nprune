import type { ReleaseRecordV1 } from '@/types';

export function parseSemver(version: string) {
  const [core, prerelease] = version.split('-');
  const parts = core.split('.');
  return {
    major: parseInt(parts[0] || '0', 10),
    minor: parseInt(parts[1] || '0', 10),
    patch: parseInt(parts[2] || '0', 10),
    prerelease: Boolean(prerelease),
  };
}

export function getSemverType(version: string): 'major' | 'minor' | 'patch' {
  const { major, minor, patch } = parseSemver(version);
  if (major > 0 && minor === 0 && patch === 0) return 'major';
  if (minor > 0 && patch === 0) return 'minor';
  if (patch > 0) return 'patch';
  return 'minor';
}

export function hasBreaking(release: ReleaseRecordV1): boolean {
  return (release.sections?.breaking?.length ?? 0) > 0;
}

/** Negative if a < b, positive if a > b, 0 if equal (semver core, pre-release ignored). */
export function compareVersion(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  return 0;
}

export function sortVersionsDesc(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareVersion(b, a));
}
