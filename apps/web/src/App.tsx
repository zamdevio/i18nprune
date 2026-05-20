import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { RuntimeHeader } from './components/layout/RuntimeHeader';
import { useAppRoute } from './hooks/useAppRoute';
import { HomePage } from './pages/home';
import { SettingsPage } from './pages/settings';
import { WorkspacePage } from './pages/workspace';
import type { WorkspaceSession } from '@i18nprune/core';

export default function App() {
  const route = useAppRoute();
  const [workspaceSession, setWorkspaceSession] = useState<WorkspaceSession | null>(null);

  return (
    <ThemeProvider>
      <RuntimeHeader />
      <main className="page-shell">
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
    </ThemeProvider>
  );
}
