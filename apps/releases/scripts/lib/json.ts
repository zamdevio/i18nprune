import fs from 'node:fs';
import path from 'node:path';
import type { ReleaseCatalogV1, StreamId } from '../../src/types/index.js';
import { RELEASES_JSON_DIR } from './utils.js';

const STREAMS: StreamId[] = ['cli', 'core', 'extension'];

/** Write pretty JSON with a trailing newline (stable diffs, editor-friendly). */
function writeJson(dest: string, value: unknown): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Emit the machine-readable release surface consumed by the CLI / agents / hosts:
 *
 * - `public/releases/index.json`            — full catalog (all streams, all versions)
 * - `public/releases/<stream>/latest.json`  — the newest record for a stream
 * - `public/releases/<stream>/<version>.json` — one record per release
 *
 * Per-version and `latest` files hold a raw {@link ReleaseRecordV1} (same shape as the
 * catalog entries) so consumers parse one shape regardless of which endpoint they hit.
 */
export function writeReleaseJson(catalog: ReleaseCatalogV1): number {
  writeJson(path.join(RELEASES_JSON_DIR, 'index.json'), catalog);

  let count = 0;
  for (const stream of STREAMS) {
    const s = catalog.streams[stream];
    if (!s) continue;
    const dir = path.join(RELEASES_JSON_DIR, stream);

    for (const version of s.versions) {
      const release = s.releases[version];
      if (!release) continue;
      writeJson(path.join(dir, `${version}.json`), release);
      count += 1;
    }

    if (s.latest && s.releases[s.latest]) {
      writeJson(path.join(dir, 'latest.json'), s.releases[s.latest]);
    }
  }

  return count;
}
