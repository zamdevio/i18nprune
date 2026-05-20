import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { RuntimeHeader } from './components/layout/RuntimeHeader';
import { useHashRoute } from './hooks/useHashRoute';
import { HomePage } from './pages/home';
import { SettingsPage } from './pages/settings';
import { WorkspacePage } from './pages/workspace';
import type { WorkspaceSession } from '@i18nprune/core';

export default function App() {
  const route = useHashRoute();
  const [workspaceSession, setWorkspaceSession] = useState<WorkspaceSession | null>(null);

  return (
    <ThemeProvider>
      <RuntimeHeader />
      <main className="page-shell">
        {route === '/settings' ? (
          <SettingsPage />
        ) : route === '/workspace' ? (
          <WorkspacePage session={workspaceSession} onSessionChange={setWorkspaceSession} />
        ) : (
          <HomePage onOpenWorkspace={setWorkspaceSession} />
        )}
      </main>
    </ThemeProvider>
  );
}
