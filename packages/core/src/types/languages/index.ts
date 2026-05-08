export type TranslateTargetLanguage = {
  code: string;
  english: string;
  native: string;
  direction: 'ltr' | 'rtl';
  [extra: string]: unknown;
};
