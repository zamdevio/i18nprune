import { describe, expect, it } from 'vitest';
import { buildProjectTreeFromPaths, emptyDirectoryPathsFromZipKeys } from '../tree.js';
import type { ProjectTreeNode } from '../../types/project/tree.js';

function fileMeta(over: Partial<{ size: number; ext: string; mimeGuess: string; textLike: boolean }> = {}) {
  return {
    size: 10,
    ext: '.txt',
    mimeGuess: 'text/plain',
    textLike: true,
    ...over,
  };
}

function collectPaths(nodes: ProjectTreeNode[]): string[] {
  const out: string[] = [];
  const walk = (n: ProjectTreeNode[]): void => {
    for (const x of n) {
      out.push(x.path);
      if (x.children) walk(x.children);
    }
  };
  walk(nodes);
  return out;
}

describe('emptyDirectoryPathsFromZipKeys', () => {
  it('normalizes trailing-slash keys', () => {
    const norm = (s: string) => s.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/+/g, '/').replace(/\/$/, '');
    const keys = ['src/a.ts', 'empty/assets/', 'foo//bar/'];
    expect(emptyDirectoryPathsFromZipKeys(keys, norm).sort()).toEqual(['empty/assets', 'foo/bar'].sort());
  });
});

describe('buildProjectTreeFromPaths', () => {
  it('builds directory and file nodes with meta shape (no nested file.path)', () => {
    const paths = ['src/a.ts', 'src/b.ts'] as const;
    const map = new Map([
      ['src/a.ts', fileMeta({ ext: '.ts', mimeGuess: 'text/javascript' })],
      ['src/b.ts', fileMeta({ ext: '.ts', mimeGuess: 'text/javascript' })],
    ]);
    const tree = buildProjectTreeFromPaths(paths, map);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.path).toBe('src');
    expect(tree[0]!.meta).toEqual({ kind: 'directory' });
    const kids = tree[0]!.children ?? [];
    expect(kids).toHaveLength(2);
    const f0 = kids.find((k) => k.path === 'src/a.ts');
    expect(f0?.meta.kind).toBe('file');
    if (f0?.meta.kind === 'file') {
      expect(f0.meta.size).toBe(10);
      expect(f0.meta.ext).toBe('.ts');
      expect((f0 as { file?: unknown }).file).toBeUndefined();
    }
  });

  it('sorts directories before files and names lexicographically', () => {
    const paths = ['z.txt', 'a/x.txt', 'a/y.txt'] as const;
    const map = new Map(
      paths.map((p) => [p, fileMeta()] as const),
    );
    const tree = buildProjectTreeFromPaths(paths, map);
    expect(collectPaths(tree)).toEqual(['a', 'a/x.txt', 'a/y.txt', 'z.txt']);
  });

  it('includes explicit empty dirs from zip-style paths (third argument)', () => {
    const paths = ['src/app.ts'] as const;
    const map = new Map([['src/app.ts', fileMeta({ ext: '.ts', mimeGuess: 'text/javascript' })]]);
    const tree = buildProjectTreeFromPaths(paths, map, ['assets', 'src/legacy']);
    expect(collectPaths(tree).sort()).toEqual(['assets', 'src', 'src/app.ts', 'src/legacy'].sort());
    const assets = tree.find((n) => n.path === 'assets');
    expect(assets?.meta).toEqual({ kind: 'directory' });
    expect(assets?.children ?? []).toHaveLength(0);
    const legacy = tree.find((n) => n.path === 'src')?.children?.find((c) => c.path === 'src/legacy');
    expect(legacy?.meta).toEqual({ kind: 'directory' });
    expect(legacy?.children ?? []).toHaveLength(0);
  });

  it('drops phantom file leaf when a directory with the same name exists (zip folder marker)', () => {
    const paths = ['public', 'public/index.html', 'src/app.ts'] as const;
    const map = new Map(
      paths.map((p) => [p, fileMeta({ size: p === 'public' ? 0 : 10, ext: p.endsWith('.html') ? '.html' : '.ts' })] as const),
    );
    const tree = buildProjectTreeFromPaths(paths, map);
    expect(collectPaths(tree)).toEqual(['public', 'public/index.html', 'src', 'src/app.ts']);
    const publicKids = tree.find((n) => n.path === 'public')?.children ?? [];
    expect(publicKids.map((k) => k.path)).toEqual(['public/index.html']);
    expect(publicKids.some((k) => k.path === 'public')).toBe(false);
  });
});
