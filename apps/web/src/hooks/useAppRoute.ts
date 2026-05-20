import { useCallback, useEffect, useState } from 'react';
import { DEMO_WEB_APP_BASE } from '@i18nprune/core';

export type HashRoute = {
  path: string;
  searchParams: URLSearchParams;
};

function parseHashRoute(): HashRoute {
  const raw = typeof window !== 'undefined' ? window.location.hash : '';
  if (!raw || raw === '#') {
    return { path: '/', searchParams: new URLSearchParams() };
  }
  const body = raw.startsWith('#') ? raw.slice(1) : raw;
  const withSlash = body.startsWith('/') ? body : `/${body}`;
  const q = withSlash.indexOf('?');
  if (q < 0) {
    const path = withSlash.replace(/\/+$/, '') || '/';
    return { path: path === '' ? '/' : path, searchParams: new URLSearchParams() };
  }
  const path = (withSlash.slice(0, q).replace(/\/+$/, '') || '/');
  return { path: path === '' ? '/' : path, searchParams: new URLSearchParams(withSlash.slice(q + 1)) };
}

export function readWorkspaceProjectIdFromLocation(): string | null {
  const { path, searchParams } = parseHashRoute();
  if (path !== '/workspace') return null;
  const id = searchParams.get('id')?.trim();
  return id && id.length > 0 ? id : null;
}

/** Public web share URL — `?id=` survives reloads on `/#/workspace`. */
export function buildWebWorkspaceShareUrl(projectId: string, origin?: string): string {
  const base = (
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : DEMO_WEB_APP_BASE)
  ).replace(/\/+$/, '');
  return `${base}/#/workspace?id=${encodeURIComponent(projectId)}`;
}

export function navigateHash(path: string): void {
  const next = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`;
  if (typeof window !== 'undefined') window.location.hash = next;
}

export function navigateWorkspace(projectId?: string): void {
  if (projectId && projectId.trim().length > 0) {
    navigateHash(`/workspace?id=${encodeURIComponent(projectId.trim())}`);
    return;
  }
  navigateHash('/workspace');
}

export function syncAppRoute(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('app-route-sync'));
}

export type AppRoute = {
  path: string;
  workspaceProjectId: string | null;
};

function resolveAppRoute(): AppRoute {
  const { path, searchParams } = parseHashRoute();
  const workspaceProjectId =
    path === '/workspace' ? (searchParams.get('id')?.trim() || null) : null;
  return { path, workspaceProjectId: workspaceProjectId && workspaceProjectId.length > 0 ? workspaceProjectId : null };
}

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
