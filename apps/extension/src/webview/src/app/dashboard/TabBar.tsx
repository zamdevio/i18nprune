import React from 'react';
import {
  Sun,
  Moon,
  X,
  FileCode,
  FileJson,
  ArrowLeft,
  ArrowRight,
  EllipsisVertical,
  ExternalLink,
} from 'lucide-react';
import { isVsCodeWebview, requestOpenDashboardInEditor } from '../../services/api';
import type { DashboardSnapshotV1, Tab } from '../../types';
import { NAV_ITEMS } from '../config/navigation';
import type { DashboardEmbedSurface } from '../../hooks/useDashboardBootstrap';

type Props = {
  tabs: Tab[];
  activeTabId: string;
  activeTabRef: React.RefObject<HTMLDivElement | null>;
  tabsContainerRef: React.RefObject<HTMLDivElement | null>;
  embedSurface: DashboardEmbedSurface | null;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isTabMenuOpen: boolean;
  setIsTabMenuOpen: (v: boolean) => void;
  setActiveTabId: (id: string) => void;
  closeTab: (id: string, e?: React.MouseEvent) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id?: string) => void;
  goPrevTab: () => void;
  goNextTab: () => void;
  onTabCtx: (e: React.MouseEvent, tabId: string) => void;
  buildEditorSnapshot: () => DashboardSnapshotV1;
};

export function TabBar({
  tabs,
  activeTabId,
  activeTabRef,
  tabsContainerRef,
  embedSurface,
  isDarkMode,
  setIsDarkMode,
  isTabMenuOpen,
  setIsTabMenuOpen,
  setActiveTabId,
  closeTab,
  closeAllTabs,
  closeOtherTabs,
  goPrevTab,
  goNextTab,
  onTabCtx,
  buildEditorSnapshot,
}: Props) {
  return (
    <header className="h-8 bg-vsc-sidebar flex items-center border-b border-vsc-border shrink-0 z-30">
      <div
        ref={tabsContainerRef}
        className="flex h-full overflow-x-auto no-scrollbar scroll-smooth flex-1 scrollbar-tabs"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={activeTabId === tab.id ? activeTabRef : null}
            role="presentation"
            onClick={() => setActiveTabId(tab.id)}
            onContextMenu={(e) => onTabCtx(e, tab.id)}
            className={`group relative px-3 min-w-[80px] h-full flex items-center gap-2 text-[11px] font-medium cursor-pointer transition-colors border-r border-vsc-border shrink-0 ${
              activeTabId === tab.id
                ? 'bg-vsc-bg text-vsc-text-bright'
                : 'bg-vsc-sidebar text-vsc-text-muted hover:bg-vsc-hover hover:text-vsc-text-bright'
            }`}
          >
            {tab.type === 'view' ? (
              NAV_ITEMS.find((n) => n.id === tab.id)?.icon &&
              React.createElement(NAV_ITEMS.find((n) => n.id === tab.id)!.icon, {
                className: `w-3.5 h-3.5 ${activeTabId === tab.id ? 'text-vsc-accent' : 'opacity-60'}`,
              })
            ) : tab.label.endsWith('.json') ? (
              <FileJson className="w-3.5 h-3.5 text-vsc-warn" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-vsc-accent" />
            )}
            <span className="truncate max-w-[100px] leading-tight select-none">
              {tab.type === 'view' ? tab.label.toUpperCase() : tab.label}
            </span>
            <button
              type="button"
              onClick={(e) => closeTab(tab.id, e)}
              className={`ml-1 p-0.5 rounded-sm hover:bg-white/10 transition-colors ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <X className="w-3 h-3" />
            </button>
            {activeTabId === tab.id && <div className="absolute top-0 left-0 right-0 h-[1px] bg-vsc-accent" />}
          </div>
        ))}
      </div>

      <div className="flex items-center h-full px-2 gap-0.5 border-l border-vsc-border bg-vsc-sidebar shrink-0">
        <div className="flex items-center gap-0.5 mr-1">
          <button
            type="button"
            className="p-1 hover:bg-vsc-hover rounded-sm text-vsc-text-muted hover:text-vsc-text-bright disabled:opacity-30 transition-colors"
            onClick={goPrevTab}
            disabled={tabs.length === 0}
            title="Previous tab (Ctrl+Z)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 hover:bg-vsc-hover rounded-sm text-vsc-text-muted hover:text-vsc-text-bright disabled:opacity-30 transition-colors"
            onClick={goNextTab}
            disabled={tabs.length === 0}
            title="Next tab (Ctrl+Shift+Z)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isVsCodeWebview && embedSurface === 'panel' && (
          <button
            type="button"
            className="p-1 hover:bg-vsc-hover rounded-sm text-vsc-text-muted hover:text-vsc-accent transition-colors shrink-0"
            title="Open in Editor"
            onClick={() => requestOpenDashboardInEditor(true, buildEditorSnapshot())}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          className="p-1 hover:bg-vsc-hover rounded-sm text-vsc-text-muted hover:text-vsc-text-bright transition-colors shrink-0"
          title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-vsc-warn" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
            disabled={tabs.length === 0}
            className={`p-1 hover:bg-vsc-hover rounded-sm text-vsc-text-muted hover:text-vsc-text-bright transition-colors ${isTabMenuOpen ? 'bg-vsc-hover' : ''} disabled:opacity-20`}
          >
            <EllipsisVertical className="w-4 h-4" />
          </button>

          {isTabMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsTabMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-36 bg-vsc-sidebar border border-vsc-border shadow-2xl rounded-sm py-1 z-50">
                <button
                  type="button"
                  onClick={() => closeOtherTabs()}
                  disabled={tabs.length <= 1}
                  className="w-full text-left px-3 py-1.5 text-[10px] uppercase font-bold text-vsc-text-muted hover:bg-vsc-hover hover:text-vsc-text-bright transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Close Others
                </button>
                <button
                  type="button"
                  onClick={closeAllTabs}
                  className="w-full text-left px-3 py-1.5 text-[10px] uppercase font-bold text-vsc-text-muted hover:bg-vsc-hover hover:text-vsc-text-bright transition-colors"
                >
                  Close All
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
