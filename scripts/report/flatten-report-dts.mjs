import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const nested = path.join(root, 'dist', 'report', 'src', 'index.d.ts');
const flat = path.join(root, 'dist', 'report.d.ts');

if (!fs.existsSync(nested)) {
  console.error(`flatten-report-dts: missing ${nested} (run tsup first)`);
  process.exit(1);
}
fs.copyFileSync(nested, flat);
