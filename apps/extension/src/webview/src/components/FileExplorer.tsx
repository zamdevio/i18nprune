import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileJson,
  FileCode,
  Folder,
  FolderOpen,
  Search,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { DirectoryEntry, listWorkspaceDirectory } from '../services/api';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  relPath: string;
  isOpen: boolean;
  loaded: boolean;
  loading?: boolean;
  children?: FileNode[];
}

const MOCK_TREE: FileNode[] = [
  {
    name: 'src',
    type: 'directory',
    relPath: 'src',
    isOpen: true,
    loaded: true,
    children: [
      {
        name: 'components',
        type: 'directory',
        relPath: 'src/components',
        isOpen: false,
        loaded: true,
        children: [
          { name: 'Login.tsx', type: 'file', relPath: 'src/components/Login.tsx', isOpen: false, loaded: true },
          { name: 'Button.tsx', type: 'file', relPath: 'src/components/Button.tsx', isOpen: false, loaded: true },
        ],
      },
      {
        name: 'locales',
        type: 'directory',
        relPath: 'src/locales',
        isOpen: true,
        loaded: true,
        children: [
          { name: 'en.json', type: 'file', relPath: 'src/locales/en.json', isOpen: false, loaded: true },
          { name: 'es.json', type: 'file', relPath: 'src/locales/es.json', isOpen: false, loaded: true },
        ],
      },
      { name: 'App.tsx', type: 'file', relPath: 'src/App.tsx', isOpen: false, loaded: true },
    ],
  },
  { name: 'package.json', type: 'file', relPath: 'package.json', isOpen: false, loaded: true },
];

function mapEntriesToNodes(entries: DirectoryEntry[]): FileNode[] {
  return entries.map((e) => ({
    name: e.name,
    type: e.type,
    relPath: e.relPath,
    isOpen: false,
    loaded: e.type === 'file',
  }));
}

function insertChildren(nodes: FileNode[], parentRel: string, newChildren: FileNode[]): FileNode[] {
  return nodes.map((node) => {
    if (node.relPath === parentRel && node.type === 'directory') {
      return {
        ...node,
        loaded: true,
        loading: false,
        children: newChildren,
      };
    }
    if (node.children?.length) {
      return { ...node, children: insertChildren(node.children, parentRel, newChildren) };
    }
    return node;
  });
}

function setNodeLoading(nodes: FileNode[], parentRel: string, loading: boolean): FileNode[] {
  return nodes.map((node) => {
    if (node.relPath === parentRel && node.type === 'directory') {
      return { ...node, loading };
    }
    if (node.children?.length) {
      return { ...node, children: setNodeLoading(node.children, parentRel, loading) };
    }
    return node;
  });
}

function toggleOpen(nodes: FileNode[], targetRel: string, isOpen: boolean): FileNode[] {
  return nodes.map((node) => {
    if (node.relPath === targetRel && node.type === 'directory') {
      return { ...node, isOpen };
    }
    if (node.children?.length) {
      return { ...node, children: toggleOpen(node.children, targetRel, isOpen) };
    }
    return node;
  });
}

export function FileExplorer({
  onFileSelect,
  useWorkspaceListing,
}: {
  onFileSelect: (filename: string, path: string) => void;
  /** When true, list the real workspace via the extension; otherwise show the Vite dev mock tree. */
  useWorkspaceListing: boolean;
}) {
  const [tree, setTree] = useState<FileNode[]>(() => (useWorkspaceListing ? [] : MOCK_TREE));
  const [search, setSearch] = useState('');
  const [rootError, setRootError] = useState<string | null>(null);
  const [rootLoading, setRootLoading] = useState(useWorkspaceListing);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onFs = (e: MessageEvent) => {
      if ((e.data as { command?: string })?.command === 'workspaceFilesystemStale') {
        setRefreshKey((k) => k + 1);
      }
    };
    window.addEventListener('message', onFs);
    return () => window.removeEventListener('message', onFs);
  }, []);

  useEffect(() => {
    if (!useWorkspaceListing) {
      setTree(MOCK_TREE);
      setRootLoading(false);
      setRootError(null);
      return;
    }
    let cancelled = false;
    setRootLoading(true);
    setRootError(null);
    setTree([]);
    void listWorkspaceDirectory('')
      .then((entries) => {
        if (cancelled) return;
        setTree(mapEntriesToNodes(entries));
      })
      .catch((err) => {
        if (cancelled) return;
        setRootError(err instanceof Error ? err.message : String(err));
        setTree([]);
      })
      .finally(() => {
        if (!cancelled) setRootLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [useWorkspaceListing, refreshKey]);

  const loadDirectory = useCallback(async (parentRel: string) => {
    setTree((prev) => setNodeLoading(prev, parentRel, true));
    try {
      const entries = await listWorkspaceDirectory(parentRel);
      const children = mapEntriesToNodes(entries);
      setTree((prev) => insertChildren(prev, parentRel, children));
    } catch (err) {
      setRootError(err instanceof Error ? err.message : String(err));
      setTree((prev) => setNodeLoading(prev, parentRel, false));
    }
  }, []);

  const filterTree = (nodes: FileNode[]): FileNode[] => {
    if (!search) return nodes;

    const fuzzyPattern = search.split('').join('.*');
    const regex = new RegExp(fuzzyPattern, 'i');

    return nodes.reduce((acc, node) => {
      if (node.type === 'directory') {
        const filteredChildren = filterTree(node.children || []);
        if (filteredChildren.length > 0 || regex.test(node.name)) {
          acc.push({ ...node, children: filteredChildren, isOpen: true });
        }
      } else if (regex.test(node.name)) {
        acc.push(node);
      }
      return acc;
    }, [] as FileNode[]);
  };

  const handleRowClick = async (node: FileNode) => {
    if (node.type === 'file') {
      onFileSelect(node.name, node.relPath);
      return;
    }
    if (node.isOpen) {
      setTree((prev) => toggleOpen(prev, node.relPath, false));
      return;
    }
    if (!node.loaded) {
      await loadDirectory(node.relPath);
    }
    setTree((prev) => toggleOpen(prev, node.relPath, true));
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isDir = node.type === 'directory';
    const Icon = isDir ? (node.isOpen ? FolderOpen : Folder) : node.name.endsWith('.json') ? FileJson : FileCode;

    return (
      <div key={node.relPath} className="select-none">
        <div
          className="group flex items-center gap-1.5 py-1 px-4 cursor-pointer hover:bg-vsc-hover transition-colors"
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
          onClick={() => void handleRowClick(node)}
        >
          {isDir &&
            (node.loading ? (
              <Loader2 className="w-3 h-3 text-vsc-accent shrink-0 animate-spin" />
            ) : node.isOpen ? (
              <ChevronDown className="w-3 h-3 text-vsc-text-muted shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-vsc-text-muted shrink-0" />
            ))}
          {!isDir && <div className="w-3 shrink-0" />}
          <Icon
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isDir ? 'text-[#eacb80]' : node.name.endsWith('.json') ? 'text-[#ffc107]' : 'text-[#519aba]'
            }`}
          />
          <span
            className={`text-[11px] truncate ${
              isDir ? 'text-vsc-text-bright font-medium' : 'text-vsc-text-muted'
            } group-hover:text-vsc-text-bright`}
          >
            {node.name}
          </span>
        </div>
        {isDir && node.isOpen && node.children && (
          <div className="flex flex-col transition-all">{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const filteredTree = filterTree(tree);

  return (
    <div className="flex flex-col h-full bg-vsc-sidebar">
      <div className="p-2 px-4 flex items-center gap-2 bg-black/5 border-b border-vsc-border/30 mb-1">
        <Search className="w-3 h-3 text-vsc-text-muted shrink-0" />
        <input
          type="text"
          placeholder="Filter files..."
          className="bg-transparent text-[10px] outline-none text-vsc-text-muted w-full font-bold uppercase tracking-widest placeholder:opacity-50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {useWorkspaceListing ? (
          <button
            type="button"
            title="Reload tree from disk"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1 rounded hover:bg-vsc-hover text-vsc-text-muted hover:text-vsc-accent shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {rootLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-[10px] text-vsc-text-muted uppercase tracking-widest">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-vsc-accent" />
            Loading…
          </div>
        )}
        {rootError && !rootLoading && (
          <div className="px-4 py-3 text-[10px] text-vsc-error leading-relaxed">{rootError}</div>
        )}
        {!rootLoading && !rootError && filteredTree.length === 0 && (
          <div className="p-4 text-center text-[10px] text-vsc-text-muted italic uppercase tracking-widest opacity-50">
            No files matched
          </div>
        )}
        {!rootLoading && !rootError && filteredTree.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
