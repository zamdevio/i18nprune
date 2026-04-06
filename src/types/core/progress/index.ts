export type ProgressCallbacks = {
  onUpdate?: (line: string) => void;
  onComplete?: () => void;
  onError?: () => void;
};

export type TranslationProgress = {
  readonly quiet: boolean;
  tick(current: number, total: number, label: string): void;
  done(): void;
  fail(): void;
};

export type SessionProgressOptions = {
  quiet?: boolean;
  json?: boolean;
};
