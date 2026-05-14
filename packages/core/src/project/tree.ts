/**
 * Project zip tree nodes for worker + web runtime (`GET .../tree`, `snapshot.tree`).
 * `path` appears once per node; file fields live under `meta` (no nested duplicate `path`/`kind`).
 */
import type { ProjectTreeNode, ProjectZipFileMetaForTree } from '../types/project/tree.js';

/**
 * Zip keys that represent explicit directory entries usually end with `/`.
 * Returns normalized paths (no trailing slash) suitable for {@link buildProjectTreeFromPaths}
 * third argument.
 */
export function emptyDirectoryPathsFromZipKeys(
  keys: readonly string[],
  normalizePath: (input: string) => string,
): string[] {
  const out = new Set<string>();
  for (const k of keys) {
    const unified = k.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/+/g, '/');
    if (!unified.endsWith('/')) continue;
    const d = normalizePath(unified);
    if (d.length > 0) out.add(d);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

/**
 * Build a sorted directory tree from flat paths and file metadata.
 * Directories are synthesized for every path prefix that contains files, plus any
 * **`emptyDirectoryPaths`** from zip directory markers (`path/`) with no files inside.
 */
export function buildProjectTreeFromPaths(
  paths: readonly string[],
  fileMeta: ReadonlyMap<string, ProjectZipFileMetaForTree>,
  emptyDirectoryPaths?: readonly string[],
): ProjectTreeNode[] {
  type TempDir = { dirs: Map<string, TempDir>; files: string[] };
  const root: TempDir = { dirs: new Map(), files: [] };
  for (const p of paths) {
    const segs = p.split('/').filter(Boolean);
    let cur = root;
    for (let i = 0; i < segs.length; i += 1) {
      const s = segs[i]!;
      const last = i === segs.length - 1;
      if (last) {
        cur.files.push(p);
      } else {
        if (!cur.dirs.has(s)) cur.dirs.set(s, { dirs: new Map(), files: [] });
        cur = cur.dirs.get(s)!;
      }
    }
  }
  if (emptyDirectoryPaths?.length) {
    for (const d of emptyDirectoryPaths) {
      const segs = d.split('/').filter(Boolean);
      let cur = root;
      for (const s of segs) {
        if (!cur.dirs.has(s)) cur.dirs.set(s, { dirs: new Map(), files: [] });
        cur = cur.dirs.get(s)!;
      }
    }
  }

  function relativeUnderBase(filePath: string, base: string): string {
    if (!base) return filePath;
    const prefix = `${base}/`;
    return filePath.startsWith(prefix) ? filePath.slice(prefix.length) : '';
  }

  function walk(dir: TempDir, base: string): ProjectTreeNode[] {
    const nodes: ProjectTreeNode[] = [];
    const dirNames = [...dir.dirs.keys()].sort((a, b) => a.localeCompare(b));
    for (const name of dirNames) {
      const path = base ? `${base}/${name}` : name;
      const child = dir.dirs.get(name)!;
      nodes.push({
        path,
        meta: { kind: 'directory' },
        children: walk(child, path),
      });
    }
    const files = [...dir.files].sort((a, b) => a.localeCompare(b));
    for (const filePath of files) {
      const m = fileMeta.get(filePath);
      if (!m) continue;
      const rel = relativeUnderBase(filePath, base);
      // Zip trees often include a zero-byte file whose path matches a folder (e.g. `public`
      // and `public/index.html`). Prefer the directory branch and omit the phantom file node.
      if (rel.length > 0 && !rel.includes('/') && dir.dirs.has(rel)) continue;
      nodes.push({
        path: filePath,
        meta: {
          kind: 'file',
          size: m.size,
          ext: m.ext,
          mimeGuess: m.mimeGuess,
          textLike: m.textLike,
        },
      });
    }
    return nodes;
  }

  return walk(root, '');
}
