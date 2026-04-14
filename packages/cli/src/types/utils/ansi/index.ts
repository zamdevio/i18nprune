export type LogLevel = 'info' | 'warn' | 'error';

export type HeaderOptions = {
  subtitle?: string;
  minWidth?: number;
  /** Omit to use **`CLI_MARK`**; pass **`""`** to hide the icon. */
  mark?: string;
};
