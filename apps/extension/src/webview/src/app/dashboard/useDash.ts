import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { requestCloseDashboardHost } from '../../services/api';
import type { DashboardSnapshotV1, KeyObservation, Tab } from '../../types';
import { NAV_ITEMS } from '../config/navigation';

export function useDash() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'dashboard', type: 'view', label: 'Monitor' }]);
  const [activeTabId, setActiveTabId] = useState('dashboard');
  const [selectedKey, setSelectedKey] = useState<KeyObservation | null>(null);
  const [sidebarSection, setSidebarSection] = useState<'navigation' | 'files'>('navigation');
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeTabId]);

  const goPrevTab = useCallback(() => {
    if (tabs.length === 0) return;
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    const cur = idx < 0 ? 0 : idx;
    setActiveTabId(tabs[cur <= 0 ? tabs.length - 1 : cur - 1]!.id);
  }, [tabs, activeTabId]);

  const goNextTab = useCallback(() => {
    if (tabs.length === 0) return;
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    const cur = idx < 0 ? 0 : idx;
    setActiveTabId(tabs[(cur + 1) % tabs.length]!.id);
  }, [tabs, activeTabId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarVisible((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? goNextTab() : goPrevTab();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrevTab, goNextTab]);

  const openTab = useCallback((tab: Tab) => {
    setTabs((prev) => (prev.find((t) => t.id === tab.id) ? prev : [...prev, tab]));
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback(
    (id: string, e?: ReactMouseEvent) => {
      e?.stopPropagation();
      const newTabs = tabs.filter((t) => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1]!.id : '');
      }
      if (newTabs.length === 0) requestCloseDashboardHost();
    },
    [tabs, activeTabId],
  );

  useEffect(() => {
    const onKeyCap = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.key !== 'w' && e.key !== 'W')) return;
      e.preventDefault();
      e.stopPropagation();
      activeTabId ? closeTab(activeTabId) : requestCloseDashboardHost();
    };
    window.addEventListener('keydown', onKeyCap, true);
    return () => window.removeEventListener('keydown', onKeyCap, true);
  }, [activeTabId, closeTab]);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId('');
    setIsTabMenuOpen(false);
    setContextMenu(null);
    requestCloseDashboardHost();
  }, []);

  const closeOtherTabs = useCallback(
    (id?: string) => {
      const targetId = id ?? activeTabId;
      const next = tabs.filter((t) => t.id === targetId);
      setTabs(next);
      if (!next.find((t) => t.id === activeTabId)) setActiveTabId(targetId);
      setIsTabMenuOpen(false);
      setContextMenu(null);
    },
    [tabs, activeTabId],
  );

  const onTabCtx = useCallback((e: ReactMouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  }, []);

  const applyDashboardSnapshot = useCallback((s: DashboardSnapshotV1) => {
    const fallback: Tab = { id: 'dashboard', type: 'view', label: 'Monitor' };
    const nextTabs = s.tabs.length > 0 ? s.tabs.map((t) => ({ ...t })) : [fallback];
    const ids = new Set(nextTabs.map((t) => t.id));
    const nextActive = ids.has(s.activeTabId) ? s.activeTabId : nextTabs[0]!.id;
    setTabs(nextTabs);
    setActiveTabId(nextActive);
    setSidebarSection(s.sidebarSection);
    setExplorerCollapsed(s.explorerCollapsed);
    setIsSidebarVisible(s.isSidebarVisible);
    setSelectedKey(s.selectedKey);
    setIsTabMenuOpen(false);
    setIsQuickSearchOpen(false);
    setContextMenu(null);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const quickPick = useMemo(
    () => [
      ...NAV_ITEMS.map((item) => ({ id: item.id, type: 'view' as const, label: item.label, category: 'Navigation' })),
      { id: 'en.json', type: 'file' as const, label: 'en.json', category: 'Locales' },
      { id: 'es.json', type: 'file' as const, label: 'es.json', category: 'Locales' },
      { id: 'App.tsx', type: 'file' as const, label: 'App.tsx', category: 'Source' },
      { id: 'Login.tsx', type: 'file' as const, label: 'Login.tsx', category: 'Components' },
    ],
    [],
  );

  return {
    tabs,
    activeTabId,
    activeTab,
    activeTabRef,
    tabsContainerRef,
    selectedKey,
    setSelectedKey,
    sidebarSection,
    setSidebarSection,
    explorerCollapsed,
    setExplorerCollapsed,
    isQuickSearchOpen,
    setIsQuickSearchOpen,
    isSidebarVisible,
    setIsSidebarVisible,
    isTabMenuOpen,
    setIsTabMenuOpen,
    contextMenu,
    setContextMenu,
    openTab,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    goPrevTab,
    goNextTab,
    setActiveTabId,
    onTabCtx,
    quickPick,
    applyDashboardSnapshot,
  };
}
