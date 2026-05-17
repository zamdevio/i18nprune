import type { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Layout, Search, Languages } from 'lucide-react';
import {
  Dashboard,
  ValidationPage,
  SyncPage,
  CleanupPage,
  SettingsPage,
  ConfigPage,
  DoctorPage,
  GeneratePage,
} from '../../pages';
import type { TranslationProviderRow, WorkspaceProjectRow } from '../../hooks/useDashboardBootstrap';
import type { CatalogRow } from '../../utils/filterLanguageCatalog';
import { FileView } from '../../components/FileView';
import type { KeyObservation, ProjectHealth, Tab } from '../../types';

type Props = {
  activeTabId: string;
  activeTab: Tab | undefined;
  health: ProjectHealth | null;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  openTab: (t: Tab) => void;
  onOpenQuickPick: () => void;
  onPickKey: (k: KeyObservation) => void;
  workspaceProjects: WorkspaceProjectRow[];
  activeProjectId: string;
  languageCatalog: CatalogRow[];
  translationProviders: TranslationProviderRow[];
  discoveredProjectsCount: number;
};

export function Stage({
  activeTabId,
  activeTab,
  health,
  isDarkMode,
  setIsDarkMode,
  openTab,
  onOpenQuickPick,
  onPickKey,
  workspaceProjects,
  activeProjectId,
  languageCatalog,
  translationProviders,
  discoveredProjectsCount,
}: Props) {
  return (
    <div className="flex-1 overflow-hidden relative">
      <AnimatePresence initial={false}>
        {!activeTabId ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-vsc-accent/5 flex items-center justify-center mb-6">
              <Layout className="w-10 h-10 text-vsc-accent/20" />
            </div>
            <h3 className="text-lg font-bold text-vsc-text-bright uppercase tracking-[0.2em] mb-2">No Open Task</h3>
            <p className="text-xs text-vsc-text-muted leading-relaxed max-w-xs mb-8">
              Select a view from the sidebar or search files using{' '}
              <span className="font-mono text-vsc-text-bright">⌘K</span> to begin localizing your project.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="p-4 bg-vsc-sidebar border border-vsc-border rounded flex flex-col items-start gap-2 group cursor-pointer hover:border-vsc-accent/40 transition-colors text-left"
                onClick={() => openTab({ id: 'dashboard', type: 'view', label: 'Monitor' })}
              >
                <BarChart3 className="w-4 h-4 text-vsc-accent" />
                <span className="text-[10px] font-bold uppercase text-vsc-text-bright">Open Monitor</span>
              </button>
              <button
                type="button"
                className="p-4 bg-vsc-sidebar border border-vsc-border rounded flex flex-col items-start gap-2 group cursor-pointer hover:border-vsc-accent/40 transition-colors text-left"
                onClick={onOpenQuickPick}
              >
                <Search className="w-4 h-4 text-vsc-warn" />
                <span className="text-[10px] font-bold uppercase text-vsc-text-bright">Quick Index</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeTabId}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.1 }}
            className="h-full overflow-y-auto themed-scrollbar p-6"
          >
            <div className={`${activeTab?.type === 'view' ? 'max-w-6xl mx-auto' : 'h-full flex flex-col'}`}>
              {activeTab?.type === 'view' ? (
                <div className="h-full">
                  {activeTab.id === 'dashboard' && health && <Dashboard health={health} />}
                  {activeTab.id === 'validation' && health && (
                    <ValidationPage observations={health.observations} onSelect={onPickKey} />
                  )}
                  {activeTab.id === 'sync' && health && <SyncPage health={health} />}
                  {activeTab.id === 'cleanup' && health && (
                    <CleanupPage observations={health.observations} onSelect={onPickKey} />
                  )}
                  {activeTab.id === 'generate' && (
                    <GeneratePage
                      languageCatalog={languageCatalog}
                      translationProviders={translationProviders}
                      discoveredProjectsCount={discoveredProjectsCount}
                    />
                  )}
                  {activeTab.id === 'doctor' && <DoctorPage />}
                  {activeTab.id === 'config' && (
                    <ConfigPage
                      isDarkMode={isDarkMode}
                      workspaceProjects={workspaceProjects}
                      activeProjectId={activeProjectId}
                    />
                  )}
                  {activeTab.id === 'settings' && (
                    <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                  )}
                  {activeTab.id === 'multi-editor' && (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 rounded-2xl bg-vsc-accent/10 flex items-center justify-center">
                        <Languages className="w-10 h-10 text-vsc-accent" />
                      </div>
                      <div className="text-center">
                        <h2 className="text-xl font-bold text-vsc-text-bright uppercase tracking-widest mb-2">
                          Sync Editor Mode
                        </h2>
                        <p className="text-xs text-vsc-text-muted max-w-sm">
                          This module is currently in development. It will provide a multi-column visual editing
                          environment for syncing translations across all target locales simultaneously.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={activeTab?.data || activeTabId}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                  <FileView
                    fileName={activeTab?.label || ''}
                    filePath={activeTab?.data || ''}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
