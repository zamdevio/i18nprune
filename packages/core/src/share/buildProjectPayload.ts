import { zipSync } from 'fflate';
import { computeCacheContentHash } from '../cache/io/hash.js';
import { ISSUE_SHARE_SNAPSHOT_EMPTY, ISSUE_SHARE_ZIP_FAILED } from '../shared/constants/issueCodes.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { ShareProjectManifest } from '../types/share/manifest.js';
import {
  assertZipWithinLimit,
  buildShareZipObject,
  collectShareSnapshotPaths,
} from './collectSnapshotPaths.js';
import { sha256HexBytes } from './sha256.js';
import { stableStringify } from './stableJson.js';

const ZIP_IGNORES_LABEL =
  'default share excludes (node_modules, .git, common build/cache dirs — see shouldSkipPathForShareZip)';

function topLevelPrefixesFromKeys(keys: readonly string[], max = 20): string[] {
  const set = new Set<string>();
  for (const k of keys) {
    const first = k.split('/')[0];
    if (first) set.add(first);
    if (set.size >= max) break;
  }
  return [...set].sort();
}

function detectConfigRelPath(keys: readonly string[]): string | null {
  for (const k of keys) {
    const base = k.split('/').pop() ?? k;
    if (/^i18nprune\.config\./.test(base)) return k;
  }
  return null;
}

export type BuildProjectPayloadResult =
  | { ok: true; zipBytes: Uint8Array; manifest: ShareProjectManifest }
  | { ok: false; issues: Issue[] };

/**
 * Builds the prepared project zip bytes plus a {@link ShareProjectManifest} for logs / `share.json` policy.
 */
export async function buildProjectPayload(input: {
  ctx: CoreContext;
  projectRoot: string;
}): Promise<BuildProjectPayloadResult> {
  const collected = collectShareSnapshotPaths(input);
  if (collected.issues.some((i) => i.severity === 'error')) {
    return { ok: false, issues: collected.issues.filter((i) => i.severity === 'error') };
  }
  if (collected.paths.length === 0) {
    return {
      ok: false,
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_SNAPSHOT_EMPTY,
          message: 'No files were collected for the project snapshot (check config paths and share zip excludes).',
        },
      ],
    };
  }

  const built = buildShareZipObject({
    ctx: input.ctx,
    projectRoot: input.projectRoot,
    paths: collected.paths,
  });
  const mergedIssues = [...collected.issues, ...built.issues];
  if (mergedIssues.some((i) => i.severity === 'error')) {
    return { ok: false, issues: mergedIssues.filter((i) => i.severity === 'error') };
  }

  let zipBytes: Uint8Array;
  try {
    zipBytes = zipSync(built.zipObject, { level: 6 });
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_ZIP_FAILED,
          message: err instanceof Error ? err.message : 'Failed to build project zip.',
        },
      ],
    };
  }

  const rawZipTooBig = assertZipWithinLimit(zipBytes);
  if (rawZipTooBig) {
    return { ok: false, issues: [rawZipTooBig] };
  }

  const keys = Object.keys(built.zipObject).sort();
  const payloadContentHash = await sha256HexBytes(zipBytes);
  const configHash = computeCacheContentHash(stableStringify(input.ctx.config), input.ctx.cache?.runtime?.hashText);

  const manifest: ShareProjectManifest = {
    kind: 'project',
    fileCount: keys.length,
    textFileCount: built.textFileCount,
    byteSize: zipBytes.byteLength,
    topLevelPrefixes: topLevelPrefixesFromKeys(keys),
    appliedZipIgnoresLabel: ZIP_IGNORES_LABEL,
    payloadContentHash,
    configHash,
    detectedConfigRelPath: detectConfigRelPath(keys),
  };

  return { ok: true, zipBytes, manifest };
}
