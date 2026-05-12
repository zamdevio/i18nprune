export type LocalesEditOptions = {
  target?: string;
  englishName?: string;
  nativeName?: string;
  direction?: 'ltr' | 'rtl';
  /** Raw CLI value, kept so invalid values can become structured command usage errors. */
  directionRaw?: string;
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
