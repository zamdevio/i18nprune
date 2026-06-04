import { ThemeProvider } from '@i18nprune/ui/react/theme';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import SiteLayout from '@/app/layout';
import NotFound from '@/pages/NotFound';
import ComparePage from '@/pages/Compare';
import Dashboard from '@/pages/Dashboard';
import ReleaseDetail from '@/pages/ReleaseDetail';
import SearchPage from '@/pages/Search';
import StreamHome from '@/pages/StreamHome';

const THEME_STORAGE_KEY = 'i18nprune-releases-theme';

export default function App() {
  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/compare/:stream" element={<ComparePage />} />
            <Route path="/:stream" element={<StreamHome />} />
            <Route path="/:stream/:version" element={<ReleaseDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
