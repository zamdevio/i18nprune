import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { OpenProjectPanel } from '../../components/OpenProjectPanel';
import { navigateWorkspace } from '../../hooks/useAppRoute.js';
import { sha256Hex } from '../../project/index.js';
import {
  deleteRecentProjectZip,
  findRecentProjectZipBySha256,
  loadRecentProjectZipFile,
  listRecentProjectZips,
  readRecentProjectZipSettings,
  readWorkerUrl,
  searchRecentProjectZips,
} from '../../storage/index.js';
import type { RecentProjectZipEntry } from '../../types/index.js';
import type { WorkspaceSession } from '@i18nprune/core';
import { DuplicateCachedZipDialog } from './duplicate-zip-dialog';
import { Dropdown } from './dropdown';
import { Hero } from './hero';
import { OpenSharedLinkPanel } from './open-shared-link';
import { Recent } from './recent';
import { SurfacesStrip } from './surfaces-strip';

type Props = {
  onOpenWorkspace: (session: WorkspaceSession) => void;
};

export function HomePage({ onOpenWorkspace }: Props) {
  const [recentQuery, setRecentQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFiles, setPanelFiles] = useState<File[]>([]);
  const [dropDepth, setDropDepth] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentProjectZipEntry[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentPageSize, setRecentPageSize] = useState(5);
  const [loadingRecentId, setLoadingRecentId] = useState<string | null>(null);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [recentSettings, setRecentSettings] = useState(() => readRecentProjectZipSettings());
  const [dupZipPrompt, setDupZipPrompt] = useState<{
    existing: RecentProjectZipEntry;
    zipFile: File;
    droppedName: string;
  } | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  const [defaultWorkerUrl, setDefaultWorkerUrl] = useState(() => readWorkerUrl());
  const refreshWorkerDefault = useCallback(() => setDefaultWorkerUrl(readWorkerUrl()), []);

  const filteredRecent = useMemo(() => searchRecentProjectZips(recentQuery), [recentQuery, recentItems]);
  const totalPages = Math.max(1, Math.ceil(filteredRecent.length / recentPageSize));
  const safePage = Math.min(Math.max(1, recentPage), totalPages);
  const pagedRecent = useMemo(
    () => filteredRecent.slice((safePage - 1) * recentPageSize, safePage * recentPageSize),
    [filteredRecent, safePage, recentPageSize],
  );

  useEffect(() => {
    if (panelOpen) {
      setDropDepth(0);
      setRecentError(null);
    }
  }, [panelOpen]);

  const refreshRecent = useCallback(() => {
    setRecentSettings(readRecentProjectZipSettings());
    setRecentItems(listRecentProjectZips());
  }, []);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  useEffect(() => {
    setRecentPage(1);
  }, [recentQuery, recentItems.length, recentSettings.enabled, recentSettings.maxCount, recentPageSize]);

  async function openRecent(entry: RecentProjectZipEntry): Promise<void> {
    setRecentError(null);
    setLoadingRecentId(entry.id);
    try {
      const file = await loadRecentProjectZipFile(entry.id);
      if (!file) {
        setRecentError('Selected cached zip no longer exists. It may have been purged.');
        refreshRecent();
        return;
      }
      refreshWorkerDefault();
      setPanelFiles([file]);
      setPanelOpen(true);
    } catch (e) {
      setRecentError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingRecentId(null);
    }
  }

  async function removeRecent(entryId: string): Promise<void> {
    await deleteRecentProjectZip(entryId);
    refreshRecent();
  }

  async function openFiles(files: FileList | File[]): Promise<void> {
    const arr = Array.from(files);
    if (arr.length === 0) return;

    const settings = readRecentProjectZipSettings();
    if (settings.enabled && arr.length === 1 && arr[0]!.name.toLowerCase().endsWith('.zip')) {
      try {
        const f0 = arr[0]!;
        const bytes = new Uint8Array(await f0.arrayBuffer());
        const hash = await sha256Hex(bytes);
        const existing = findRecentProjectZipBySha256(hash);
        if (existing) {
          const zipFile = new File([bytes], f0.name, { type: f0.type || 'application/zip' });
          setDupZipPrompt({ existing, zipFile, droppedName: f0.name });
          return;
        }
        const zipFile = new File([bytes], f0.name, { type: f0.type || 'application/zip' });
        refreshWorkerDefault();
        setPanelFiles([zipFile]);
        setPanelOpen(true);
        return;
      } catch {
        /* fall through to default path */
      }
    }

    refreshWorkerDefault();
    setPanelFiles(arr);
    setPanelOpen(true);
  }

  const rangeStart = filteredRecent.length === 0 ? 0 : (safePage - 1) * recentPageSize + 1;
  const rangeEnd = Math.min(safePage * recentPageSize, filteredRecent.length);

  const canUseRecent = recentSettings.enabled && recentSettings.maxCount > 0;

  const setPage = (next: number): void => {
    const clamped = Math.min(Math.max(1, Math.floor(next)), totalPages);
    setRecentPage(clamped);
  };

  return (
    <div className="page page--home">
      <Hero
        zipInputRef={zipInputRef}
        dirInputRef={dirInputRef}
        onZipInputChange={(f) => {
          if (f && f.length) void openFiles(f);
        }}
        onDirInputChange={(f) => {
          if (f && f.length) void openFiles(f);
        }}
      />

      <OpenSharedLinkPanel />

      <SurfacesStrip />

      <Dropdown
        dropDepth={dropDepth}
        onDragEnter={(e) => {
          e.preventDefault();
          setDropDepth((d) => d + 1);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDropDepth((d) => Math.max(0, d - 1));
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDropDepth(0);
          const dropped = e.dataTransfer.files;
          if (dropped.length) void openFiles(dropped);
        }}
      />

      <Recent
        recentQuery={recentQuery}
        onRecentQueryChange={setRecentQuery}
        canUseRecent={canUseRecent}
        filteredRecent={filteredRecent}
        pagedRecent={pagedRecent}
        recentError={recentError}
        loadingRecentId={loadingRecentId}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        safePage={safePage}
        totalPages={totalPages}
        recentPageSize={recentPageSize}
        onPageSizeChange={setRecentPageSize}
        onSetPage={setPage}
        onOpenRecent={openRecent}
        onRemoveRecent={(id) => void removeRecent(id)}
      />

      {dupZipPrompt ? (
        <DuplicateCachedZipDialog
          existing={dupZipPrompt.existing}
          droppedName={dupZipPrompt.droppedName}
          onDismiss={() => setDupZipPrompt(null)}
          onOpenCached={() => {
            const cur = dupZipPrompt;
            if (!cur) return;
            setDupZipPrompt(null);
            void openRecent(cur.existing);
          }}
          onProcessAgain={() => {
            const cur = dupZipPrompt;
            if (!cur) return;
            setDupZipPrompt(null);
            refreshWorkerDefault();
            setPanelFiles([cur.zipFile]);
            setPanelOpen(true);
          }}
        />
      ) : null}

      <OpenProjectPanel
        open={panelOpen}
        initialFiles={panelFiles}
        defaultWorkerUrl={defaultWorkerUrl}
        onClose={() => setPanelOpen(false)}
        onComplete={(session) => {
          refreshRecent();
          onOpenWorkspace(session);
          navigateWorkspace(session.mode === 'remote' ? session.projectId : undefined);
        }}
        preferredMode={recentSettings.defaultMode === 'ask' ? undefined : recentSettings.defaultMode}
      />
    </div>
  );
}
