import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildReleasesIndexNowUrlList, RELEASES_URL } from '@i18nprune/seo';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contentDir = path.join(repoRoot, 'apps/releases/content');

const RELEASE_STREAMS = ['cli', 'core'] as const;

function releaseYamlExists(stream: string, version: string): boolean {
  const base = path.join(contentDir, stream, version);
  return fs.existsSync(`${base}.yaml`) || fs.existsSync(`${base}.yml`);
}

/**
 * @param {string} version
 * @param {string} [origin]
 */
export function urlsFromReleaseVersion(version: string, origin = RELEASES_URL): string[] {
  const streams = RELEASE_STREAMS.filter((stream) => releaseYamlExists(stream, version));
  if (streams.length === 0) {
    throw new Error(
      `No release YAML found for version ${version} under apps/releases/content/{cli,core}/`,
    );
  }
  return buildReleasesIndexNowUrlList(version, streams, origin);
}
