export type IdentitySample = {
  readonly sourceText: string;
  readonly translatedText: string;
  readonly path: string;
};

export type IdentityStreakState = {
  consecutiveIdentity: number;
  lastPath: string;
};

export type IdentityStreakInteractive = () => boolean;

export type IdentityStreakConfirmInput = {
  command: string;
  target: string;
  count: number;
  latestPath: string;
  samples: readonly IdentitySample[];
};

export type IdentityStreakConfirmFn = (input: IdentityStreakConfirmInput) => Promise<boolean>;

export type IdentityStreakGuardOptions = {
  command: string;
  target: string;
  threshold?: number;
  interactive?: IdentityStreakInteractive;
  confirm?: IdentityStreakConfirmFn;
};

import type { Issue } from '../json/envelope/index.js';

export type IdentityStreakGuard = {
  onTranslated: (sourceText: string, translatedText: string, path: string) => Promise<void>;
  flushIssues: () => Issue[];
};
