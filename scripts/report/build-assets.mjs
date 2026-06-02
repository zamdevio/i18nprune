import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

const source = path.join(repoRoot, 'apps', 'report', 'dist', 'index.html');
const targets = [
  path.join(repoRoot, 'dist', 'report', 'index.html'),
  path.join(repoRoot, 'packages', 'cli', 'dist', 'report', 'index.html'),
];

if (!fs.existsSync(path.join(repoRoot, 'apps', 'report'))) {
  throw new Error('Missing required app at apps/report. CLI build cannot continue.');
}
if (!fs.existsSync(source)) {
  throw new Error(
    `Missing required report artifact: ${source}. Build apps/report first; CLI build cannot continue.`,
  );
}
for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
