import React from 'react';
import { useTheme, type ThemeMode } from '../theme/ThemeContext.js';
import { ToolbarDropdown } from './ToolbarDropdown.js';

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
