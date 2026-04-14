/** Output of `mask()`: MT input text + `{{...}}` originals in sentinel order. */
export type MaskedText = {
  text: string;
  originals: string[];
};
