import { useCallback, useEffect, useState } from 'react';
import { resolveAppRoute, syncAppRoute } from '../app/index.js';
import type { AppRoute } from '../types/index.js';

export {
  buildWebWorkspaceShareUrl,
  navigateHash,
  navigateWorkspace,
  readWorkspaceProjectIdFromLocation,
  syncAppRoute,
} from '../app/index.js';

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => resolveAppRoute());

  const sync = useCallback(() => {
    setRoute(resolveAppRoute());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('app-route-sync', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('app-route-sync', sync);
    };
  }, [sync]);

  return route;
}
