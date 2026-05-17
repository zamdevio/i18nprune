import React from 'react';
import { Sun } from 'lucide-react';
import { Button, Card } from '../../components/shared';

export default function SettingsPage({
  isDarkMode,
  setIsDarkMode,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}) {
  return (
    <div className="max-w-3xl space-y-6">
      <header className="px-1">
        <h3 className="text-sm font-bold text-vsc-text-bright uppercase tracking-wider">Settings</h3>
        <p className="text-[11px] text-vsc-text-muted mt-2 leading-relaxed">
          Extension-wide preferences for this dashboard. Project roots, config files, and previews live under{' '}
          <span className="text-vsc-text-bright font-semibold">Project config</span> in the sidebar.
        </p>
      </header>

      <Card title="Appearance">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-black/5 rounded group hover:bg-vsc-hover transition-colors">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-vsc-text-bright flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-vsc-warn" />
                Dashboard theme
              </div>
              <p className="text-[10px] text-vsc-text-muted">
                Currently using {isDarkMode ? 'dark' : 'light'} mode for this webview only.
              </p>
            </div>
            <Button size="xs" variant="secondary" onClick={() => setIsDarkMode(!isDarkMode)}>
              Switch to {isDarkMode ? 'Light' : 'Dark'}
            </Button>
          </div>
          <div className="p-3 border border-vsc-border rounded bg-vsc-sidebar">
            <p className="text-[10px] text-vsc-text-muted leading-relaxed">
              Stored in the browser storage local to this dashboard instance — not synced with VS Code workbench theme.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
