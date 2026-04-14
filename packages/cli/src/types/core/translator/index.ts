/** HTTP/API backend: one string in, one string out (placeholders handled by `Translator`). */
export type TranslateRequest = {
  text: string;
  sourceLang: string;
  targetLang: string;
};

/** Defaults: 3 tries; delays 400ms / 900ms after 1st and 2nd failure. */
export type TranslatorRetryOptions = {
  maxAttempts: number;
  delaysMs: number[];
};

export type Translator = {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
};
