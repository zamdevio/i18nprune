/**
 * Project zip tree nodes for worker + web runtime (`GET .../tree`, `snapshot.tree`).
 * `path` appears once per node; file fields live under `meta` (no nested duplicate `path`/`kind`).
 */
export type ProjectTreeFileMeta = {
  kind: 'file';
  size: number;
  ext: string;
  mimeGuess: string;
  textLike: boolean;
};

export type ProjectTreeDirMeta = {
  kind: 'directory';
};

export type ProjectTreeNode = {
  path: string;
  meta: ProjectTreeFileMeta | ProjectTreeDirMeta;
  children?: ProjectTreeNode[];
};

/** Per-path file fields required to build file nodes (path is the map key, not repeated here). */
export type ProjectZipFileMetaForTree = {
  size: number;
  ext: string;
  mimeGuess: string;
  textLike: boolean;
};
