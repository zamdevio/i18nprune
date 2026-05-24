import React from 'react';
import { useTheme } from '@i18nprune/ui/react/theme';
import type { ThemeMode } from '@i18nprune/ui/types/theme';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle(): JSX.Element {
  const { mode, setMode } = useTheme();
  return (
    <ToolbarDropdown
      className="toolbar-dropdown--theme"
      prefix="Theme"
      ariaLabel="Color theme"
      options={OPTIONS}
      value={mode}
      onChange={setMode}
    />
  );
}
