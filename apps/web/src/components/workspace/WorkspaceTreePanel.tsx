import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

type TreeNode = Record<string, unknown>;

/** Zip / APIs sometimes emit a 0-byte, no-extension “file” whose path is really an empty folder. */
function looksLikeEmptyFolderPlaceholder(n: TreeNode, base: string): boolean {
  const m = n.meta && typeof n.meta === 'object' ? (n.meta as Record<string, unknown>) : null;
  if (m?.kind !== 'file') return false;
  if (typeof m.size !== 'number' || m.size !== 0) return false;
  const ext = typeof m.ext === 'string' ? m.ext.replace(/^\./, '').trim() : '';
  if (ext.length > 0) return false;
  if (base.includes('.')) return false;
  const kids = Array.isArray(n.children) ? (n.children as unknown[]).length : 0;
  if (kids > 0) return false;
  return base.length > 0;
}

function isDirNode(n: TreeNode): boolean {
  const kids = Array.isArray(n.children) ? (n.children as unknown[]) : [];
  if (kids.length > 0) return true;
  const m = n.meta && typeof n.meta === 'object' ? (n.meta as Record<string, unknown>) : null;
  if (m?.kind === 'directory') return true;
  if (n.kind === 'directory') return true;
  const base =
    typeof n.path === 'string' && n.path.includes('/') ? n.path.slice(n.path.lastIndexOf('/') + 1) : String(n.path ?? '');
  if (looksLikeEmptyFolderPlaceholder(n, base)) return true;
  return false;
}

function isFileNode(n: TreeNode): boolean {
  if (isDirNode(n)) return false;
  const m = n.meta && typeof n.meta === 'object' ? (n.meta as Record<string, unknown>) : null;
  if (m?.kind === 'file') return true;
  return n.kind === 'file';
}

function fileMeta(n: TreeNode): Record<string, unknown> | null {
  const m = n.meta && typeof n.meta === 'object' ? (n.meta as Record<string, unknown>) : null;
  if (m?.kind === 'file') return m;
  const f = n.file && typeof n.file === 'object' ? (n.file as Record<string, unknown>) : null;
  return f;
}

/** Normalized extension token (no leading dot), lowercase. */
function extKeyFromNode(n: TreeNode, base: string): string {
  const fm = fileMeta(n);
  const ext = fm && typeof fm.ext === 'string' ? fm.ext : '';
  if (ext) return ext.replace(/^\./, '').toLowerCase();
  const i = base.lastIndexOf('.');
  if (i <= 0 || i === base.length - 1) return '';
  return base.slice(i + 1).toLowerCase();
}

function extLabel(key: string): string {
  if (!key) return '—';
  return key.toUpperCase();
}

/** Same-path siblings: prefer directory over phantom file; if both dirs, keep richer `children`. */
function pickBetterTreeNode(prev: TreeNode, next: TreeNode): TreeNode {
  const pd = isDirNode(prev);
  const nd = isDirNode(next);
  if (nd && !pd) return next;
  if (pd && !nd) return prev;
  if (pd && nd) {
    const pk = Array.isArray(prev.children) ? (prev.children as unknown[]).length : 0;
    const nk = Array.isArray(next.children) ? (next.children as unknown[]).length : 0;
    return nk > pk ? next : prev;
  }
  return prev;
}

function dedupeTreeSiblings(nodes: unknown[]): unknown[] {
  const order: string[] = [];
  const map = new Map<string, TreeNode>();
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const n = raw as TreeNode;
    const p = typeof n.path === 'string' ? n.path : '?';
    const prev = map.get(p);
    if (!prev) {
      map.set(p, n);
      order.push(p);
    } else {
      map.set(p, pickBetterTreeNode(prev, n));
    }
  }
  return order.map((path) => map.get(path)!);
}

function extClass(key: string): string {
  switch (key) {
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return 'workspace-tree__ext workspace-tree__ext--ts';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'workspace-tree__ext workspace-tree__ext--js';
    case 'vue':
      return 'workspace-tree__ext workspace-tree__ext--vue';
    case 'svelte':
      return 'workspace-tree__ext workspace-tree__ext--svelte';
    case 'json':
      return 'workspace-tree__ext workspace-tree__ext--json';
    case 'md':
    case 'mdx':
      return 'workspace-tree__ext workspace-tree__ext--md';
    case 'txt':
      return 'workspace-tree__ext workspace-tree__ext--txt';
    default:
      return 'workspace-tree__ext workspace-tree__ext--muted';
  }
}

function TreeRows({
  nodes,
  depth,
  maxDepth,
  collapsed,
  toggleDir,
}: {
  nodes: unknown[];
  depth: number;
  maxDepth: number;
  collapsed: ReadonlySet<string>;
  toggleDir: (path: string) => void;
}): ReactNode {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  const rows = dedupeTreeSiblings(nodes);
  return (
    <ul className="workspace-tree__list" style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
      {rows.map((raw, i) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
        const n = raw as TreeNode;
        const nodePath = typeof n.path === 'string' ? n.path : '?';
        const base = nodePath.includes('/') ? nodePath.slice(nodePath.lastIndexOf('/') + 1) : nodePath;
        const kids = Array.isArray(n.children) ? (n.children as unknown[]) : [];
        const dir = isDirNode(n);
        const file = isFileNode(n);
        const fm = file ? fileMeta(n) : null;
        const size = fm && typeof fm.size === 'number' ? fm.size : null;
        const textLike = fm && typeof fm.textLike === 'boolean' ? fm.textLike : null;
        const hasKids = dir && kids.length > 0;
        const emptyDir = dir && kids.length === 0;
        const isCollapsed = collapsed.has(nodePath);
        const deeper = hasKids && depth < maxDepth && !isCollapsed;
        const omitted = hasKids && depth >= maxDepth;
        const extKey = file ? extKeyFromNode(n, base) : '';

        return (
          <li key={`${nodePath}-${i}`} className="workspace-tree__item">
            <div
              className={`workspace-tree__row${file ? ' workspace-tree__row--file' : ''}`}
              title={file || dir ? nodePath : undefined}
            >
              {hasKids ? (
                <button
                  type="button"
                  className="workspace-tree__chevron"
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? `Expand folder ${base}` : `Collapse folder ${base}`}
                  onClick={() => toggleDir(nodePath)}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
              ) : emptyDir ? (
                <span
                  className="workspace-tree__chevron workspace-tree__chevron--emptydir"
                  title="Empty folder"
                  aria-hidden
                >
                  ○
                </span>
              ) : (
                <span className="workspace-tree__chevron workspace-tree__chevron--spacer" aria-hidden />
              )}
              {dir ? (
                <span className="workspace-tree__badge workspace-tree__badge--dir">dir</span>
              ) : file ? (
                <span className="workspace-tree__badge workspace-tree__badge--file">file</span>
              ) : (
                <span className="workspace-tree__badge">?</span>
              )}
              {file ? <span className={extClass(extKey)}>{extLabel(extKey)}</span> : null}
              <code className="workspace-tree__path">{base}</code>
              {emptyDir ? (
                <span className="workspace-tree__empty muted" title="No files in this folder">
                  empty
                </span>
              ) : null}
              {!dir && file && size !== null ? (
                <span className="workspace-tree__meta">
                  {size} B{textLike === false ? ' · non-text' : ''}
                </span>
              ) : null}
            </div>
            {deeper ? (
              <TreeRows
                nodes={kids}
                depth={depth + 1}
                maxDepth={maxDepth}
                collapsed={collapsed}
                toggleDir={toggleDir}
              />
            ) : null}
            {omitted ? (
              <p className="muted workspace-tree__omit">
                … {String(kids.length)} entr{kids.length === 1 ? 'y' : 'ies'} not expanded (depth limit — see Raw JSON)
              </p>
            ) : null}
            {hasKids && isCollapsed && depth < maxDepth ? (
              <p className="muted workspace-tree__omit">
                … {String(kids.length)} entr{kids.length === 1 ? 'y' : 'ies'} collapsed
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  /** `snapshot.tree` or `GET .../tree` `tree` array. */
  roots: unknown;
  /** Max nesting depth for child rows (keeps UI responsive on huge repos). */
  maxDepth?: number;
};

/** Tree preview for workspace Tree / Snapshot (v2 `meta` + legacy `kind`/`file`). */
export function WorkspaceTreePanel({ roots, maxDepth = 8 }: Props): JSX.Element | null {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const toggleDir = useCallback((nodePath: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodePath)) next.delete(nodePath);
      else next.add(nodePath);
      return next;
    });
  }, []);

  if (!Array.isArray(roots) || roots.length === 0) return null;

  return (
    <div className="workspace-tree">
      <p className="workspace-tree__title">Tree preview</p>
      <p className="workspace-tree__hint muted">Click ▶/▼ to expand or collapse folders.</p>
      <div className="workspace-tree__scroll">
        <TreeRows
          nodes={roots as unknown[]}
          depth={0}
          maxDepth={maxDepth}
          collapsed={collapsed}
          toggleDir={toggleDir}
        />
      </div>
    </div>
  );
}
