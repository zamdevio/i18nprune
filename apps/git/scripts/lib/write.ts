import fs from 'node:fs';
import path from 'node:path';

/** Write JSON only when content changed (stable formatting). */
export function writeJsonIfChanged(filePath: string, data: unknown): boolean {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    const prev = fs.readFileSync(filePath, 'utf8');
    if (prev === next) return false;
  }
  fs.writeFileSync(filePath, next);
  return true;
}
