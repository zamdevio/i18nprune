import { useCallback, useEffect, useState } from 'react';
import { useCompactLayout } from './useMediaQuery';

const STORAGE_KEY = 'i18nprune-git-sidebar-collapsed';

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

export function useSidebarCollapse(): {
  collapsed: boolean;
  mobileOpen: boolean;
  isCompact: boolean;
  toggle: () => void;
  closeMobile: () => void;
} {
  const isCompact = useCompactLayout();
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    if (isCompact) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [isCompact]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (!isCompact) setMobileOpen(false);
  }, [isCompact]);

  useEffect(() => {
    if (!isCompact || !mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isCompact, mobileOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isCompact && mobileOpen) {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== 'b' || !(event.ctrlKey || event.metaKey)) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, isCompact, mobileOpen, closeMobile]);

  return { collapsed, mobileOpen, isCompact, toggle, closeMobile };
}
