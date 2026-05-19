/** File-level diff between a baseline and the current scan, used for `--debug-cache` output. */
export type CacheFileDelta = {
  added: string[];
  changed: string[];
  deleted: string[];
  unchanged: string[];
};
