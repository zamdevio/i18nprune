export type TranslationCallSite = {
  functionName: string;
  matchIndex: number;
  openParenIndex: number;
  closeParenIndex: number;
  firstArgStart: number;
  firstArgEnd: number;
  firstArgRaw: string;
  isEmptyCall: boolean;
  isMultilineCall: boolean;
};
