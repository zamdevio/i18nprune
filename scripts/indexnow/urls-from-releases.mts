import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildReleasesIndexNowUrlList,
  parseReleaseStreamEntries,
  RELEASES_URL,
  type ReleaseStreamVersion,
} from '@i18nprune/seo';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contentDir = path.join(repoRoot, 'apps/releases/content');

export type SkippedReleaseStream = {
  stream: string;
  version: string;
  reason: 'missing_yaml';
};

export type ReleasesIndexNowUrls = {
  urlList: string[];
  skipped: SkippedReleaseStream[];
  included: ReleaseStreamVersion[];
};

function releaseYamlExists(stream: string, version: string): boolean {
  const base = path.join(contentDir, stream, version);
  return fs.existsSync(`${base}.yaml`) || fs.existsSync(`${base}.yml`);
}

/**
 * @param {readonly string[]} streamTokens
 * @param {string | null} defaultVersion
 * @param {string} [origin]
 */
export function urlsFromReleaseStreams(
  streamTokens: readonly string[],
  defaultVersion: string | null,
  origin = RELEASES_URL,
): ReleasesIndexNowUrls {
  const requested = parseReleaseStreamEntries(streamTokens, defaultVersion);
  const included: ReleaseStreamVersion[] = [];
  const skipped: SkippedReleaseStream[] = [];

  for (const entry of requested) {
    if (!releaseYamlExists(entry.stream, entry.version)) {
      skipped.push({
        stream: entry.stream,
        version: entry.version,
        reason: 'missing_yaml',
      });
      continue;
    }
    included.push(entry);
  }

  const urlList = buildReleasesIndexNowUrlList(included, origin);
  return { urlList, skipped, included };
}
