import { FolderOpen, Moon, Sun } from 'lucide-react';

type Props = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
};

export default function AppNoWorkspace({ isDarkMode, onToggleTheme }: Props) {
  return (
    <div
      className={`h-screen w-full flex flex-col bg-vsc-bg ${isDarkMode ? 'text-vsc-text' : 'text-vsc-text'}`}
    >
      <header className="h-9 px-3 flex items-center justify-end border-b border-vsc-border bg-vsc-sidebar shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-sm border border-vsc-border bg-vsc-bg hover:bg-vsc-hover transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-3 h-3 text-vsc-warn" /> : <Moon className="w-3 h-3 text-white" />}
        </button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <FolderOpen className="w-14 h-14 text-vsc-accent/35 mb-5" strokeWidth={1.25} />
        <h1 className="text-base font-black text-vsc-text-bright tracking-tight mb-2 text-center">
          No workspace folder open
        </h1>
        <p className="text-vsc-text-muted text-sm text-center max-w-md leading-relaxed mb-3">
          Use <span className="font-mono text-[11px] text-vsc-text">File → Open Folder…</span> and choose a project that
          contains your source and locale files (and optionally{' '}
          <span className="font-mono text-[11px] text-vsc-text">i18nprune.config.*</span>).
        </p>
        <p className="text-vsc-text-muted/85 text-[11px] text-center max-w-sm leading-relaxed">
          This dashboard listens for workspace changes — when you open a folder, validation starts automatically. You can
          leave this tab open.
        </p>
      </div>
    </div>
  );
}
