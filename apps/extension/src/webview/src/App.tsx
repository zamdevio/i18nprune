import { useCallback, useEffect, useState } from 'react';
import { useDashboardBootstrap } from './hooks/useDashboardBootstrap';
import { useThemeMode } from './hooks/useThemeMode';
import AppConnecting from './app/states/AppConnecting';
import AppNoWorkspace from './app/states/AppNoWorkspace';
import AppLoading from './app/states/AppLoading';
import { DashboardShell } from './app/dashboard';
import { isVsCodeWebview } from './services/api';
import type { DashboardSnapshotV1 } from './types';
import { parseDashboardSnapshot } from './utils/parseDashboardSnapshot';

export default function App() {
  const { isDarkMode, setIsDarkMode, toggleDarkMode } = useThemeMode();
  const boot = useDashboardBootstrap();
  const [restoreSnapshot, setRestoreSnapshot] = useState<DashboardSnapshotV1 | null>(null);

  const onRestoreSnapshotConsumed = useCallback(() => setRestoreSnapshot(null), []);

  useEffect(() => {
    if (!isVsCodeWebview) return;
    const onMsg = (e: MessageEvent) => {
      const msg = e.data as { command?: string; state?: unknown };
      if (msg?.command !== 'dashboardStateRestore') return;
      const parsed = parseDashboardSnapshot(msg.state);
      if (parsed) setRestoreSnapshot(parsed);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!boot.workspaceHandshakeDone) {
    return <AppConnecting />;
  }

  if (boot.hasWorkspaceFolder === false) {
    return <AppNoWorkspace isDarkMode={isDarkMode} onToggleTheme={toggleDarkMode} />;
  }

  if (boot.loading) {
    return <AppLoading />;
  }

  return (
    <DashboardShell
      health={boot.health}
      embedSurface={boot.embedSurface}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      restoreSnapshot={restoreSnapshot}
      onRestoreSnapshotConsumed={onRestoreSnapshotConsumed}
      workspaceProjects={boot.workspaceProjects}
      activeProjectId={boot.activeProjectId}
      languageCatalog={boot.languageCatalog}
      translationProviders={boot.translationProviders}
    />
  );
}
