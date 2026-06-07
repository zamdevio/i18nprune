#!/usr/bin/env node
/**
 * Ensures `scripts/sync.js` is idempotent (second run produces identical `content/`).
 * CI gate: `pnpm docs:sync:verify` after edits under `docs/`.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const docsAppRoot = path.resolve(here, '..');
const contentDir = path.join(docsAppRoot, 'content');
const syncScript = path.join(here, 'sync.js');

function walkFiles(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...walkFiles(full, base));
      continue;
    }
    out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out.sort();
}

function hashContentDir() {
  const files = walkFiles(contentDir);
  const hash = createHash('sha256');
  for (const rel of files) {
    const body = fs.readFileSync(path.join(contentDir, rel));
    hash.update(rel);
    hash.update('\0');
    hash.update(body);
    hash.update('\0');
  }
  return hash.digest('hex');
}

function runSync() {
  execFileSync(process.execPath, [syncScript], { cwd: docsAppRoot, stdio: 'inherit' });
}

runSync();
const first = hashContentDir();
runSync();
const second = hashContentDir();

if (first !== second) {
  console.error('docs:sync:verify failed — sync.js is not idempotent (content/ changed on second run).');
  process.exit(1);
}

console.log(`docs:sync:verify OK — ${walkFiles(contentDir).length} file(s), hash ${first.slice(0, 12)}…`);
