import type { ReactNode } from 'react';
import type { ToolbarDropdownOption } from './option.js';

export type ToolbarDropdownProps<T extends string = string> = {
  /** Shown before the current value (omit when using `triggerLabel`). */
  prefix?: string;
  options: readonly ToolbarDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** e.g. `toolbar-dropdown--dropup`, `toolbar-dropdown--header-nav` */
  className?: string;
  disabled?: boolean;
  /** Fixed trigger label (hides selected option on the button). */
  triggerLabel?: string;
  /** Shown after triggerLabel with a separator (header nav workspace picker). */
  suffixLabel?: string;
  /** Optional icon before trigger text. */
  icon?: ReactNode;
  /** Show dropdown chevron on the trigger (default false). */
  showChevron?: boolean;
};
