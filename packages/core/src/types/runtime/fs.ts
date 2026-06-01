export type RuntimeDirEntry = {
  name: string;
  kind: 'file' | 'directory' | 'other';
};

export type RuntimeFsPathKind = RuntimeDirEntry['kind'] | 'missing';

export type RuntimeReadFsPort = {
  exists: (filePath: string) => boolean | Promise<boolean>;
  readText: (filePath: string) => string | Promise<string>;
};

export type RuntimeFsPort = RuntimeReadFsPort & {
  statKind: (filePath: string) => RuntimeFsPathKind | Promise<RuntimeFsPathKind>;
  listDir: (dirPath: string) => RuntimeDirEntry[] | Promise<RuntimeDirEntry[]>;
  writeText: (filePath: string, content: string) => void | Promise<void>;
  deleteFile: (filePath: string) => void | Promise<void>;
  mkdirp: (dirPath: string) => void | Promise<void>;
  /** When set, returns the canonical path for cycle-safe directory walks (Node: `fs.realpathSync`). */
  realpath?: (filePath: string) => string;
};
