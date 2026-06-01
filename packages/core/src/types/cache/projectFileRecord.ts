/** Per-file hash/size/mtime record stored in `files.json`. */
export type CacheProjectFileRecord = {
  hash: string;
  size: number;
  mtimeMs: number;
  updatedAt: string;
};
