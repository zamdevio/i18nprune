import type { ToolbarDropdownOption } from './option.js';

export type ToolbarDropdownProps<T extends string = string> = {
  prefix: string;
  options: readonly ToolbarDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** e.g. `toolbar-dropdown--dropup`, `toolbar-dropdown--theme` */
  className?: string;
};
