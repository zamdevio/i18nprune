#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import type { ReleaseCatalogV1, StreamId } from '../src/types/index.js';
import { writeFeeds } from './lib/build.js';
import { writeChangelog } from './lib/changelog.js';
import { writeReleaseJson } from './lib/json.js';
import { loadAllReleaseFiles, PUBLIC_DIR, REPO_ROOT, siteOrigin } from './lib/utils.js';

const STREAMS: StreamId[] = ['cli', 'core', 'extension'];
const entries = loadAllReleaseFiles();

const streams = Object.fromEntries(
  STREAMS.map((id) => [id, { latest: null as string | null, versions: [] as string[], releases: {} }]),
) as ReleaseCatalogV1['streams'];

for (const { stream, version, data } of entries) {
  if (!streams[stream]) continue;
  streams[stream].releases[version] = data;
}

for (const streamId of STREAMS) {
  const s = streams[streamId];
  s.versions = Object.keys(s.releases).sort((a, b) => semver.rcompare(a, b, true));
  s.latest = s.versions[0] ?? null;
}

const catalog: ReleaseCatalogV1 = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  streams,
};

const json = `${JSON.stringify(catalog, null, 2)}\n`;

// Internal bundle for the SPA (imported by src/features/catalog).
const srcCatalog = path.join(REPO_ROOT, 'src/data/releases.json');
fs.mkdirSync(path.dirname(srcCatalog), { recursive: true });
fs.writeFileSync(srcCatalog, json);

const origin = siteOrigin();

// Public machine-readable surface: /releases/index.json + per-stream latest + per-version.
const versionFiles = writeReleaseJson(catalog);

// Feeds + sitemap.
writeFeeds(entries, origin, PUBLIC_DIR);

// Generated changelog (committed at the monorepo root).
writeChangelog(entries, origin);

// Drop the pre-rename `/data/releases.json` asset if it lingers locally.
fs.rmSync(path.join(PUBLIC_DIR, 'data/releases.json'), { force: true });

console.log(`Wrote catalog (${entries.length} releases) → src/data/releases.json`);
console.log(`Wrote release JSON → public/releases/index.json + ${versionFiles} version files`);
console.log(`Wrote CHANGELOG.md (monorepo root)`);
console.log(`Wrote feeds → public/feed.xml, public/atom.xml, public/sitemap.xml (${origin})`);
