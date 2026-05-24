import { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@i18nprune/ui/react/theme';
import { EcosystemFooter } from './components/layout/EcosystemFooter';
import { RuntimeHeader } from './components/layout/RuntimeHeader';
import { THEME_STORAGE_KEY } from './constants/index.js';
import { useAppRoute } from './hooks/useAppRoute';
import { HomePage } from './pages/home';
import { SettingsPage } from './pages/settings';
import { WorkspacePage } from './pages/workspace';
import type { WorkspaceSession } from '@i18nprune/core';

export default function App() {
  const route = useAppRoute();
  const [workspaceSession, setWorkspaceSession] = useState<WorkspaceSession | null>(null);
  const prevWorkspaceProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    const leftWorkspace = route.path !== '/workspace';
    const droppedShareId =
      route.path === '/workspace' &&
      prevWorkspaceProjectIdRef.current != null &&
      route.workspaceProjectId == null;

    if (leftWorkspace || droppedShareId) {
      setWorkspaceSession(null);
    }

    prevWorkspaceProjectIdRef.current =
      route.path === '/workspace' ? route.workspaceProjectId : null;
  }, [route.path, route.workspaceProjectId]);

  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY} applyStrategy="class" alwaysPersist={false}>
      <RuntimeHeader />
      <main className="page-shell page-shell--with-footer">
        {route.path === '/settings' ? (
          <SettingsPage />
        ) : route.path === '/workspace' ? (
          <WorkspacePage
            session={workspaceSession}
            workspaceProjectId={route.workspaceProjectId}
            onSessionChange={setWorkspaceSession}
          />
        ) : (
          <HomePage onOpenWorkspace={setWorkspaceSession} />
        )}
      </main>
      <EcosystemFooter />
    </ThemeProvider>
  );
}
