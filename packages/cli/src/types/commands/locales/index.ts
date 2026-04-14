export type LocalesEditOptions = {
  target?: string;
  englishName?: string;
  nativeName?: string;
  direction?: 'ltr' | 'rtl';
};

export type LocalesDeleteOptions = {
  target?: string;
  /** Ask for an additional safety confirmation in TTY mode. */
  ask?: boolean;
};

export type LocalesDynamicOptions = {
  top?: number;
  full?: boolean;
};
