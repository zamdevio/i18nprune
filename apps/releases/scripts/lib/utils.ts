import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import type { ReleaseRecordV1, StreamId } from '../../src/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `apps/releases` app root */
export const REPO_ROOT = path.resolve(__dirname, '../..');
/** Monorepo root (`i18nprune/`). */
export const MONOREPO_ROOT = path.resolve(REPO_ROOT, '../..');
export const CONTENT_DIR = path.join(REPO_ROOT, 'content');
export const SCHEMA_PATH = path.join(REPO_ROOT, 'schema/release.schema.json');
/** Deployed static assets for the portal. */
export const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
/** Machine-readable release JSON namespace (`/releases/…` on the deployed site). */
export const RELEASES_JSON_DIR = path.join(PUBLIC_DIR, 'releases');
/** Generated, committed changelog at the monorepo root. */
export const CHANGELOG_PATH = path.join(MONOREPO_ROOT, 'CHANGELOG.md');

const STREAMS: StreamId[] = ['cli', 'core', 'extension'];

export type LoadedRelease = {
  stream: StreamId;
  version: string;
  filePath: string;
  data: ReleaseRecordV1;
};

export function loadAllReleaseFiles(): LoadedRelease[] {
  const entries: LoadedRelease[] = [];
  for (const stream of STREAMS) {
    const dir = path.join(CONTENT_DIR, stream);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.yaml') && !name.endsWith('.yml')) continue;
      const filePath = path.join(dir, name);
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = yaml.parse(raw) as ReleaseRecordV1;
      const version = name.replace(/\.ya?ml$/, '');
      entries.push({ stream, version, filePath, data });
    }
  }
  return entries;
}

export function siteOrigin(): string {
  return process.env.SITE_ORIGIN?.replace(/\/$/, '') || 'https://releases.i18nprune.dev';
}

export function buildVersionIndex(
  entries: Pick<LoadedRelease, 'stream' | 'version'>[],
): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const { stream, version } of entries) {
    if (!index.has(stream)) index.set(stream, new Set());
    index.get(stream)!.add(version);
  }
  return index;
}
