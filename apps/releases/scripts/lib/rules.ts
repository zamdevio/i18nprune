import semver from 'semver';
import type { CompatEntry, StreamId } from '../../src/types/index.js';

const KNOWN_STREAMS = new Set<StreamId>(['cli', 'core', 'extension']);

export function validateCompatList(
  filePath: string,
  releaseStream: string,
  compat: CompatEntry[] | undefined,
  versionIndex: Map<string, Set<string>>,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!compat?.length) {
    if (releaseStream === 'cli') {
      warnings.push(
        `${filePath}: CLI release has no compat block — consider declaring the bundled Core version.`,
      );
    }
    return { errors, warnings };
  }

  const bundledByStream = new Map<string, string[]>();
  const minByStream = new Map<string, string[]>();

  for (let i = 0; i < compat.length; i++) {
    const entry = compat[i];
    const loc = `${filePath} compat[${i}]`;

    if (!entry?.stream) {
      errors.push(`${loc}: missing stream`);
      continue;
    }

    if (!KNOWN_STREAMS.has(entry.stream)) {
      errors.push(`${loc}: unknown stream "${entry.stream}"`);
      continue;
    }

    const hasVersion = entry.version != null && entry.version !== '';
    const hasMin = entry.minVersion != null && entry.minVersion !== '';

    if (!hasVersion && !hasMin) {
      errors.push(`${loc}: set version (bundled) or minVersion (compatible with)`);
      continue;
    }

    if (hasVersion && hasMin) {
      errors.push(`${loc}: use version or minVersion on one entry, not both`);
      continue;
    }

    if (hasVersion) {
      const refErr = validateExactRef(loc, entry.stream, entry.version!, versionIndex);
      if (refErr) errors.push(refErr);

      if (isDuplicate(bundledByStream, entry.stream, entry.version!)) {
        errors.push(
          `${loc}: duplicate bundled version "${entry.version}" for stream "${entry.stream}"`,
        );
      } else {
        appendToMap(bundledByStream, entry.stream, entry.version!);
      }
    }

    if (hasMin) {
      const refErr = validateMinRef(loc, entry.stream, entry.minVersion!, versionIndex);
      if (refErr) errors.push(refErr);

      if (isDuplicate(minByStream, entry.stream, entry.minVersion!)) {
        errors.push(
          `${loc}: duplicate minVersion "${entry.minVersion}" for stream "${entry.stream}"`,
        );
      } else {
        appendToMap(minByStream, entry.stream, entry.minVersion!);
      }
    }
  }

  for (const [targetStream, versions] of bundledByStream) {
    if (versions.length > 1) {
      errors.push(
        `${filePath}: only one bundled version allowed per stream, but "${targetStream}" has ${versions.length} version entries (${versions.join(', ')}). ` +
          `Keep the Core version shipped with this release as version; list other supported Core releases as minVersion.`,
      );
    }
  }

  for (const [targetStream, bundled] of bundledByStream) {
    const mins = minByStream.get(targetStream) ?? [];
    for (const v of bundled) {
      if (mins.includes(v)) {
        errors.push(
          `${filePath}: "${v}" is both bundled (version) and minVersion for stream "${targetStream}"`,
        );
      }
    }
  }

  if (releaseStream === 'cli') {
    const coreBundled = bundledByStream.get('core') ?? [];
    if (coreBundled.length === 0 && (minByStream.get('core')?.length ?? 0) > 0) {
      errors.push(
        `${filePath}: CLI lists compatible Core versions (minVersion) but no bundled Core (version). ` +
          `Add exactly one compat entry with version for the Core built into this CLI.`,
      );
    }
    if (coreBundled.length === 0 && compat.length > 0) {
      warnings.push(
        `${filePath}: CLI compat has no bundled Core version — add one version entry for stream core.`,
      );
    }
  }

  return { errors, warnings };
}

function isDuplicate(map: Map<string, string[]>, stream: string, value: string): boolean {
  return (map.get(stream) ?? []).includes(value);
}

function appendToMap(map: Map<string, string[]>, stream: string, value: string): void {
  const list = map.get(stream) ?? [];
  list.push(value);
  map.set(stream, list);
}

function validateExactRef(
  loc: string,
  targetStream: string,
  version: string,
  versionIndex: Map<string, Set<string>>,
): string | null {
  if (!semver.valid(version)) {
    return `${loc}: invalid semver "${version}"`;
  }

  const published = versionIndex.get(targetStream);
  if (!published?.size) {
    return `${loc}: no published ${targetStream} releases — cannot reference v${version}`;
  }

  if (!published.has(version)) {
    return `${loc}: ${targetStream} v${version} does not exist — published: ${formatPublished(published)}`;
  }

  return null;
}

function validateMinRef(
  loc: string,
  targetStream: string,
  minVersion: string,
  versionIndex: Map<string, Set<string>>,
): string | null {
  if (!semver.valid(minVersion)) {
    return `${loc}: invalid semver "${minVersion}"`;
  }

  const published = versionIndex.get(targetStream);
  if (!published?.size) {
    return `${loc}: no published ${targetStream} releases — cannot set minVersion ${minVersion}`;
  }

  const hasMatch = [...published].some((v) => semver.gte(v, minVersion, true));
  if (!hasMatch) {
    return `${loc}: no published ${targetStream} release >= ${minVersion} — published: ${formatPublished(published)}`;
  }

  return null;
}

function formatPublished(versions: Set<string>): string {
  return [...versions].sort((a, b) => semver.rcompare(a, b, true)).join(', ');
}
