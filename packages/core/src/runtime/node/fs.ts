import fs from 'node:fs';
import path from 'node:path';
import type { RuntimeFsPort } from '../contracts/index.js';

export const nodeReadFsRuntime: RuntimeFsPort = {
  exists: (filePath) => fs.existsSync(filePath),
  readText: (filePath) => fs.readFileSync(filePath, 'utf8'),
  statKind: (filePath) => {
    if (!fs.existsSync(filePath)) return 'missing';
    const st = fs.statSync(filePath);
    if (st.isFile()) return 'file';
    if (st.isDirectory()) return 'directory';
    return 'other';
  },
  listDir: (dirPath) =>
    fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      kind: entry.isFile() ? 'file' : entry.isDirectory() ? 'directory' : 'other',
    })),
  writeText: (filePath, content) => fs.writeFileSync(filePath, content, 'utf8'),
  deleteFile: (filePath) => fs.unlinkSync(filePath),
  mkdirp: (dirPath) => {
    fs.mkdirSync(path.resolve(dirPath), { recursive: true });
  },
};
