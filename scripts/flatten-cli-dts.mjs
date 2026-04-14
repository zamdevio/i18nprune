import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const pairs = [
  ['dist/cli/src/exports/config.d.ts', 'dist/config.d.ts'],
  ['dist/cli/src/exports/core.d.ts', 'dist/core.d.ts'],
];

for (const [relFrom, relTo] of pairs) {
  const from = path.join(root, relFrom);
  const to = path.join(root, relTo);
  if (!fs.existsSync(from)) {
    console.error(`flatten-cli-dts: missing ${from} (run tsup first)`);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
}
