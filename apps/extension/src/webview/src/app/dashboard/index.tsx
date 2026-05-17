import { useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { QuickSearch } from '../../components/QuickSearch';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import type { DashboardSnapshotV1, ProjectHealth } from '../../types';
import { DASHBOARD_SNAPSHOT_VERSION } from '../../types';
import type {
  DashboardEmbedSurface,
  TranslationProviderRow,
  WorkspaceProjectRow,
} from '../../hooks/useDashboardBootstrap';
import { NAV_ITEMS } from '../config/navigation';
import type { CatalogRow } from '../../utils/filterLanguageCatalog';
import { useDash } from './useDash';
import { NavRail } from './NavRail';
import { ExpandFab } from './ExpandFab';
import { TabBar } from './TabBar';
import { TabCtxMenu } from './TabCtxMenu';
import { Stage } from './Stage';
import { KeyModal } from './KeyModal';
import { StatusBar } from './StatusBar';

type Props = {
  health: ProjectHealth | null;
  embedSurface: DashboardEmbedSurface | null;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  /** When set, editor (or late panel) applies this snapshot once then clears via callback. */
  restoreSnapshot: DashboardSnapshotV1 | null;
  onRestoreSnapshotConsumed: () => void;
  workspaceProjects: WorkspaceProjectRow[];
  activeProjectId: string;
  languageCatalog: CatalogRow[];
  translationProviders: TranslationProviderRow[];
};

export function DashboardShell({
  health,
  embedSurface,
  isDarkMode,
  setIsDarkMode,
  restoreSnapshot,
  onRestoreSnapshotConsumed,
  workspaceProjects,
  activeProjectId,
  languageCatalog,
  translationProviders,
}: Props) {
  const d = useDash();
  const discoveredProjectsCount = workspaceProjects.filter((p) => p.kind === 'config').length;

  useEffect(() => {
    const onNav = (ev: Event) => {
      const e = ev as CustomEvent<{ tabId?: string }>;
      const tabId = e.detail?.tabId;
      if (!tabId) return;
      const item = NAV_ITEMS.find((n) => n.id === tabId);
      if (item) d.openTab({ id: item.id, type: 'view', label: item.label });
    };
    window.addEventListener('i18nprune-navigate', onNav);
    return () => window.removeEventListener('i18nprune-navigate', onNav);
  }, [d.openTab]);

  const buildEditorSnapshot = useCallback((): DashboardSnapshotV1 => {
    return {
      v: DASHBOARD_SNAPSHOT_VERSION,
      tabs: d.tabs,
      activeTabId: d.activeTabId,
      sidebarSection: d.sidebarSection,
      explorerCollapsed: d.explorerCollapsed,
      isSidebarVisible: d.isSidebarVisible,
      isDarkMode,
      selectedKey: d.selectedKey,
    };
  }, [
    d.tabs,
    d.activeTabId,
    d.sidebarSection,
    d.explorerCollapsed,
    d.isSidebarVisible,
    d.selectedKey,
    isDarkMode,
  ]);

  useEffect(() => {
    if (!restoreSnapshot) return;
    d.applyDashboardSnapshot(restoreSnapshot);
    setIsDarkMode(restoreSnapshot.isDarkMode);
    onRestoreSnapshotConsumed();
  }, [restoreSnapshot, d.applyDashboardSnapshot, setIsDarkMode, onRestoreSnapshotConsumed]);

  return (
    <div
      className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-vsc-bg text-vsc-text' : 'bg-vsc-bg text-vsc-text'}`}
    >
      <NavRail
        health={health}
        visible={d.isSidebarVisible}
        activeTabId={d.activeTabId}
        openTab={d.openTab}
        section={d.sidebarSection}
        setSection={d.setSidebarSection}
        explorerCollapsed={d.explorerCollapsed}
        setExplorerCollapsed={d.setExplorerCollapsed}
        onOpenQuickPick={() => d.setIsQuickSearchOpen(true)}
        onHide={() => d.setIsSidebarVisible(false)}
      />

      <ExpandFab show={!d.isSidebarVisible} onExpand={() => d.setIsSidebarVisible(true)} />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-vsc-bg">
        <TabBar
          tabs={d.tabs}
          activeTabId={d.activeTabId}
          activeTabRef={d.activeTabRef}
          tabsContainerRef={d.tabsContainerRef}
          embedSurface={embedSurface}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isTabMenuOpen={d.isTabMenuOpen}
          setIsTabMenuOpen={d.setIsTabMenuOpen}
          setActiveTabId={d.setActiveTabId}
          closeTab={d.closeTab}
          closeAllTabs={d.closeAllTabs}
          closeOtherTabs={d.closeOtherTabs}
          goPrevTab={d.goPrevTab}
          goNextTab={d.goNextTab}
          onTabCtx={d.onTabCtx}
          buildEditorSnapshot={buildEditorSnapshot}
        />

        <TabCtxMenu
          menu={d.contextMenu}
          onDismiss={() => d.setContextMenu(null)}
          closeOtherTabs={d.closeOtherTabs}
          closeAllTabs={d.closeAllTabs}
        />

        <div className="bg-vsc-sidebar border-b border-vsc-border/50 shrink-0">
          <Breadcrumbs
            path={d.activeTab?.type === 'view' ? d.activeTab.label : d.activeTab?.data || ''}
            type={d.activeTab?.type || 'view'}
          />
        </div>

        <Stage
          activeTabId={d.activeTabId}
          activeTab={d.activeTab}
          health={health}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          openTab={d.openTab}
          onOpenQuickPick={() => d.setIsQuickSearchOpen(true)}
          onPickKey={d.setSelectedKey}
          workspaceProjects={workspaceProjects}
          activeProjectId={activeProjectId}
          languageCatalog={languageCatalog}
          translationProviders={translationProviders}
          discoveredProjectsCount={discoveredProjectsCount}
        />

        <QuickSearch
          isOpen={d.isQuickSearchOpen}
          onClose={() => d.setIsQuickSearchOpen(false)}
          onSelect={(item) => {
            d.openTab({ id: item.id, type: item.type, label: item.label, data: item.id });
            d.setIsQuickSearchOpen(false);
          }}
          items={d.quickPick}
        />

        <KeyModal keyObs={d.selectedKey} onClose={() => d.setSelectedKey(null)} openTab={d.openTab} />

        <StatusBar
          activeProjectLabel={
            workspaceProjects.find((p) => p.id === activeProjectId)?.label ??
            (activeProjectId === 'implicit' ? 'workspace default' : '')
          }
        />
      </main>
    </div>
  );
}
