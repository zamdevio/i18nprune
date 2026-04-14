import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ReportProvider } from './context/report/index.js';
import { ThemeProvider } from './theme/ThemeContext.js';
import { AppShell } from './components/shell/index.js';
import { OverviewPage } from './pages/overview/index.js';
import { MissingPage } from './pages/missing/index.js';
import { DynamicPage } from './pages/dynamic/index.js';
import { ObservationsPage } from './pages/observations/index.js';
import { HeatmapPage } from './pages/heatmap/index.js';
import { NamespacesPage } from './pages/namespaces/index.js';

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <ReportProvider>
        <HashRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/missing" element={<MissingPage />} />
              <Route path="/dynamic" element={<DynamicPage />} />
              <Route path="/observations" element={<ObservationsPage />} />
              <Route path="/heatmap" element={<HeatmapPage />} />
              <Route path="/namespaces" element={<NamespacesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </HashRouter>
      </ReportProvider>
    </ThemeProvider>
  );
}
