import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CacheRuntime, RuntimeAdapters } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

export function nodeCacheHashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function defaultCliCacheRootDir(): string {
  return path.join(os.homedir(), '.i18nprune', 'cache');
}

export function buildCliCacheRuntime(adapters: RuntimeAdapters = createNodeRuntimeAdapters()): CacheRuntime {
  return {
    fs: adapters.fs,
    path: adapters.path,
    system: adapters.system,
    hashText: nodeCacheHashText,
    byteLength: (text) => Buffer.byteLength(text, 'utf8'),
    fileSize: (filePath) => {
      try {
        return fs.statSync(filePath).size;
      } catch {
        return undefined;
      }
    },
    writeTextAtomic: (filePath, content) => {
      const dir = adapters.path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${filePath}.tmp-${process.pid}-${Date.now().toString(36)}`;
      fs.writeFileSync(tmp, content, 'utf8');
      fs.renameSync(tmp, filePath);
    },
    deleteDir: (dirPath) => {
      fs.rmSync(dirPath, { recursive: true, force: true });
    },
  };
}
