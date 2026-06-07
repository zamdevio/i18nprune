import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const source = path.join(repoRoot, 'apps', 'report', 'dist', 'index.html');
const target = path.join(repoRoot, 'packages', 'core', 'dist', 'report', 'index.html');

if (!fs.existsSync(source)) {
  console.warn(`[report] skip core copy — missing ${source} (build apps/report first for HTML bundle)`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log(`[report] copied SPA shell → packages/core/dist/report/index.html`);
