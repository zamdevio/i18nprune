export type RuntimePathPort = {
  join: (...parts: string[]) => string;
  dirname: (value: string) => string;
  basename: (value: string, ext?: string) => string;
  normalize: (value: string) => string;
  relative: (from: string, to: string) => string;
  resolve: (...parts: string[]) => string;
  isAbsolute: (value: string) => boolean;
};
