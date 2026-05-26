import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EditorPreferenceProvider } from './context/editor/index.js';
import { ReportProvider } from './context/report/index.js';
import { Toaster } from '@i18nprune/ui/react/feedback';
import { ThemeProvider } from '@i18nprune/ui/react/theme';
import { AppShell } from './components/shell/index.js';
import { ReportDocGate } from './components/report-doc-gate/index.js';
import { HomePage } from './pages/home/index.js';
import { OverviewPage } from './pages/overview/index.js';
import { MissingPage } from './pages/missing/index.js';
import { DynamicPage } from './pages/dynamic/index.js';
import { ObservationsPage } from './pages/observations/index.js';
import { HeatmapPage } from './pages/heatmap/index.js';
import { NamespacesPage } from './pages/namespaces/index.js';
import { SettingsPage } from './pages/settings/index.js';

const THEME_STORAGE_KEY = 'i18nprune-report-theme';

export function App(): JSX.Element {
  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY} applyStrategy="class-and-data-theme" alwaysPersist={false}>
      <Toaster />
      <HashRouter>
        <EditorPreferenceProvider>
          <ReportProvider>
            <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route element={<ReportDocGate />}>
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/missing" element={<MissingPage />} />
                <Route path="/dynamic" element={<DynamicPage />} />
                <Route path="/observations" element={<ObservationsPage />} />
                <Route path="/heatmap" element={<HeatmapPage />} />
                <Route path="/namespaces" element={<NamespacesPage />} />
              </Route>
              <Route path="/share" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            </Routes>
          </ReportProvider>
        </EditorPreferenceProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
