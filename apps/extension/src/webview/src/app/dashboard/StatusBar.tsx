import { FolderGit2, RefreshCw, ShieldCheck } from 'lucide-react';

export function StatusBar({ activeProjectLabel }: { activeProjectLabel?: string }) {
  return (
    <footer className="h-6 bg-vsc-status-bg text-white flex items-center px-4 justify-between text-[10px] font-medium shrink-0 z-20">
      <div className="flex items-center gap-4 h-full">
        {activeProjectLabel ? (
          <div
            className="flex items-center gap-1.5 px-2 h-full max-w-[220px] truncate"
            title={activeProjectLabel}
          >
            <FolderGit2 className="w-3 h-3 shrink-0 opacity-80" />
            <span className="truncate opacity-90">{activeProjectLabel}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 cursor-pointer transition-colors h-full">
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 h-full">
          <RefreshCw className="w-3 h-3" />
          <span>INDEXING COMPLETE</span>
        </div>
      </div>
      <div className="flex items-center gap-4 h-full">
        <span className="px-2 hover:bg-white/10 h-full flex items-center cursor-pointer">TypeScript React</span>
        <div className="flex items-center gap-1 hover:bg-white/10 h-full px-2 cursor-pointer group">
          <ShieldCheck className="w-3.5 h-3.5 group-hover:text-vsc-accent transition-colors" />
          <span>Engine Ready</span>
        </div>
      </div>
    </footer>
  );
}
