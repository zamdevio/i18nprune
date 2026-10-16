import { useEffect, useState } from 'react';
import type { TranslationProviderId } from '@i18nprune/core';
import { fetchProjectHealth, isVsCodeWebview, notifyExtensionWebviewReady } from '../services/api';
import type { ProjectHealth } from '../types';
import type { CatalogRow } from '../utils/filterLanguageCatalog';

export type DashboardEmbedSurface = 'editor' | 'panel';

export type WorkspaceProjectRow = {
  id: string;
  label: string;
  projectRoot: string;
  kind: 'config' | 'implicit';
};

export type TranslationProviderRow = {
  id: TranslationProviderId;
  label: string;
  defaultWorkers: number;
};

export type DashboardBootstrap = {
  workspaceHandshakeDone: boolean;
  hasWorkspaceFolder: boolean | null;
  health: ProjectHealth | null;
  loading: boolean;
  embedSurface: DashboardEmbedSurface | null;
  workspaceProjects: WorkspaceProjectRow[];
  activeProjectId: string;
  languageCatalog: CatalogRow[];
  translationProviders: TranslationProviderRow[];
};

const MOCK_CATALOG: CatalogRow[] = [
  { code: 'fr', english: 'French', native: 'français' },
  { code: 'es', english: 'Spanish', native: 'español' },
  { code: 'de', english: 'German', native: 'Deutsch' },
];

/**
 * Standalone dev preview only — the extension host sends the real list
 * (`translationProvidersMeta.ts`, derived from core at runtime at zero webview cost).
 *
 * Keyed by `TranslationProviderId`, so adding or removing a provider id in core fails this build
 * until the mock is updated — the dev list cannot silently drift. Kept **type-only** on purpose:
 * importing core *values* (even just `TRANSLATION_PROVIDER_IDS`) pulls the whole `shared` graph
 * (~73 KB) into the bundle, and this webview is deliberately core-free
 * (see `utils/filterLanguageCatalog.ts`). `defaultWorkers` mirrors core rate-limit `maxConcurrency`.
 */
const MOCK_PROVIDER_META: Record<TranslationProviderId, { label: string; defaultWorkers: number }> = {
  google: { label: 'Google Translate', defaultWorkers: 32 },
  brave: { label: 'Brave Translate', defaultWorkers: 4 },
  mymemory: { label: 'MyMemory', defaultWorkers: 2 },
  libre: { label: 'LibreTranslate', defaultWorkers: 6 },
  deepl: { label: 'DeepL', defaultWorkers: 4 },
  llm: { label: 'LLM (OpenAI-compatible)', defaultWorkers: 2 },
};

const MOCK_PROVIDERS: TranslationProviderRow[] = (
  Object.keys(MOCK_PROVIDER_META) as TranslationProviderId[]
).map((id) => ({ id, ...MOCK_PROVIDER_META[id] }));

export function useDashboardBootstrap(): DashboardBootstrap {
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWorkspaceFolder, setHasWorkspaceFolder] = useState<boolean | null>(() =>
    isVsCodeWebview ? null : true,
  );
  const [workspaceHandshakeDone, setWorkspaceHandshakeDone] = useState(() => !isVsCodeWebview);
  const [embedSurface, setEmbedSurface] = useState<DashboardEmbedSurface | null>(null);
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProjectRow[]>(() =>
    isVsCodeWebview ? [] : [{ id: 'implicit', label: '(dev)', projectRoot: '/', kind: 'implicit' }],
  );
  const [activeProjectId, setActiveProjectId] = useState(() => (isVsCodeWebview ? 'implicit' : 'implicit'));
  const [languageCatalog, setLanguageCatalog] = useState<CatalogRow[]>(() =>
    isVsCodeWebview ? [] : MOCK_CATALOG,
  );
  const [translationProviders, setTranslationProviders] = useState<TranslationProviderRow[]>(() =>
    isVsCodeWebview ? [] : MOCK_PROVIDERS,
  );

  useEffect(() => {
    if (!isVsCodeWebview) return;
    const handler = (e: MessageEvent) => {
      const msg = e.data as {
        command?: string;
        hasFolder?: boolean;
        embedSurface?: DashboardEmbedSurface;
        projects?: WorkspaceProjectRow[];
        activeProjectId?: string;
        languageCatalog?: CatalogRow[];
        translationProviders?: TranslationProviderRow[];
      };
      if (msg?.command === 'workspaceProjects') {
        if (Array.isArray(msg.projects)) setWorkspaceProjects(msg.projects);
        if (typeof msg.activeProjectId === 'string') setActiveProjectId(msg.activeProjectId);
        return;
      }
      if (msg?.command !== 'workspaceSnapshot') return;
      setHasWorkspaceFolder(Boolean(msg.hasFolder));
      if (msg.embedSurface === 'editor' || msg.embedSurface === 'panel') {
        setEmbedSurface(msg.embedSurface);
      }
      if (Array.isArray(msg.projects)) setWorkspaceProjects(msg.projects);
      if (typeof msg.activeProjectId === 'string') setActiveProjectId(msg.activeProjectId);
      if (Array.isArray(msg.languageCatalog)) setLanguageCatalog(msg.languageCatalog);
      if (Array.isArray(msg.translationProviders)) setTranslationProviders(msg.translationProviders);
      setWorkspaceHandshakeDone(true);
    };
    window.addEventListener('message', handler);
    notifyExtensionWebviewReady();
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!workspaceHandshakeDone) return;
    if (hasWorkspaceFolder === false) {
      setHealth(null);
      setLoading(false);
      return;
    }
    if (hasWorkspaceFolder !== true) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchProjectHealth();
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) setHealth(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceHandshakeDone, hasWorkspaceFolder]);

  return {
    workspaceHandshakeDone,
    hasWorkspaceFolder,
    health,
    loading,
    embedSurface,
    workspaceProjects,
    activeProjectId,
    languageCatalog,
    translationProviders,
  };
}
