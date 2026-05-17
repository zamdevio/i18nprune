import { useEffect, useState } from 'react';
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
  id: string;
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

const MOCK_PROVIDERS: TranslationProviderRow[] = [
  { id: 'google', label: 'Google Translate', defaultWorkers: 32 },
  { id: 'deepl', label: 'DeepL', defaultWorkers: 4 },
];

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
