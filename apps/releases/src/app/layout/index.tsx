/** App shell: header, footer, outlet, and ⌘K search shortcut. */
import SiteFooter from '@/app/layout/footer';
import SiteHeader from '@/app/layout/header';
import { focusReleaseSearch } from '@/features/search/keyboard';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (location.pathname === '/' || location.pathname === '/search') {
          focusReleaseSearch();
        } else {
          navigate('/search', { state: { focusSearch: true } });
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
