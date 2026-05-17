import { motion, AnimatePresence } from 'motion/react';
import { Layout, Search, Command, ChevronDown, PanelLeft } from 'lucide-react';
import { FileExplorer } from '../../components/FileExplorer';
import { NAV_ITEMS } from '../config/navigation';
import { isVsCodeWebview } from '../../services/api';
import type { ProjectHealth, Tab } from '../../types';

type Props = {
  health: ProjectHealth | null;
  visible: boolean;
  activeTabId: string;
  openTab: (t: Tab) => void;
  section: 'navigation' | 'files';
  setSection: (v: 'navigation' | 'files') => void;
  explorerCollapsed: boolean;
  setExplorerCollapsed: (v: boolean) => void;
  onOpenQuickPick: () => void;
  onHide: () => void;
};

export function NavRail({
  health,
  visible,
  activeTabId,
  openTab,
  section,
  setSection,
  explorerCollapsed,
  setExplorerCollapsed,
  onOpenQuickPick,
  onHide,
}: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="bg-vsc-sidebar border-r border-vsc-border flex flex-col shrink-0 overflow-hidden"
        >
          <div className="h-9 px-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-vsc-text-muted border-b border-vsc-border bg-vsc-sidebar shrink-0">
            <div className="flex items-center gap-2">
              <Layout className="w-3.5 h-3.5 text-vsc-accent" />
              <span className="text-vsc-text-bright">I18NPRUNE</span>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-vsc-border bg-black/5 shrink-0">
            <button
              type="button"
              onClick={onOpenQuickPick}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm bg-vsc-bg border border-vsc-border hover:border-vsc-accent transition-colors group"
            >
              <Search className="w-3 h-3 text-vsc-text-muted group-hover:text-vsc-accent" />
              <span className="text-[10px] text-vsc-text-muted uppercase font-bold tracking-tight text-left">
                Quick Search
              </span>
              <div className="ml-auto flex items-center gap-0.5 opacity-30 select-none">
                <Command className="w-2 h-2" />
                <span className="text-[9px]">K</span>
              </div>
            </button>
          </div>

          <div className="border-b border-vsc-border shrink-0">
            <button
              type="button"
              className="h-7 w-full flex items-center gap-1 px-1 bg-black/5 cursor-pointer hover:bg-vsc-hover select-none"
              onClick={() => setSection(section === 'navigation' ? 'files' : 'navigation')}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${section === 'navigation' ? '' : '-rotate-90'}`}
              />
              <span className="text-[10px] font-bold uppercase text-vsc-text-muted">Views</span>
            </button>

            <AnimatePresence initial={false}>
              {section === 'navigation' && (
                <motion.nav
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="py-1 overflow-hidden"
                >
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openTab({ id: item.id, type: 'view', label: item.label })}
                      className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-[11px] font-medium transition-all ${
                        activeTabId === item.id
                          ? 'bg-vsc-accent text-white shadow-lg shadow-vsc-accent/10'
                          : 'text-vsc-text-muted hover:bg-vsc-hover hover:text-vsc-text-bright'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.id === 'validation' && (health?.observations.length || 0) > 0 && (
                        <span className="ml-auto px-1 rounded-sm bg-vsc-error text-white text-[9px] font-bold">
                          {health?.observations.length}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.nav>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <button
              type="button"
              className="h-7 flex items-center gap-1 px-1 bg-black/5 border-b border-vsc-border/30 cursor-pointer hover:bg-vsc-hover select-none shrink-0 w-full"
              onClick={() => setExplorerCollapsed(!explorerCollapsed)}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${explorerCollapsed ? '-rotate-90' : ''}`}
              />
              <span className="text-[10px] font-bold uppercase text-vsc-text-muted">Explorer</span>
            </button>
            <div
              className={`flex-1 overflow-hidden transition-all duration-300 ${explorerCollapsed ? 'opacity-0 scale-95 h-0' : 'opacity-100 scale-100'}`}
            >
              {!explorerCollapsed && (
                <FileExplorer
                  useWorkspaceListing={isVsCodeWebview}
                  onFileSelect={(name, path) => openTab({ id: path, type: 'file', label: name, data: path })}
                />
              )}
            </div>
          </div>

          <div className="p-1 border-t border-vsc-border bg-vsc-sidebar shrink-0">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-vsc-hover rounded-sm text-vsc-text-muted hover:text-vsc-text-bright transition-colors group relative"
              onClick={onHide}
            >
              <PanelLeft className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold uppercase opacity-60">Collapse Sidebar</span>
              <div className="absolute left-full ml-3 px-2 py-1 bg-vsc-sidebar border border-vsc-border text-[9px] font-bold uppercase whitespace-nowrap rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                Collapse Sidebar (CTRL+B)
              </div>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
