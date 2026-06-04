#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import type { ReleaseCatalogV1, StreamId } from '../src/types/index.js';
import { writeFeeds } from './lib/build.js';
import { loadAllReleaseFiles, REPO_ROOT, siteOrigin } from './lib/utils.js';

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

const srcCatalog = path.join(REPO_ROOT, 'src/data/releases.json');
const publicCatalog = path.join(REPO_ROOT, 'public/data/releases.json');
for (const dest of [srcCatalog, publicCatalog]) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, json);
}

const origin = siteOrigin();
const publicDir = path.join(REPO_ROOT, 'public');
writeFeeds(entries, origin, publicDir);

console.log(
  `Wrote catalog (${entries.length} releases) → src/data/releases.json, public/data/releases.json`,
);
console.log(`Wrote feeds → public/feed.xml, public/atom.xml, public/sitemap.xml (${origin})`);
