import { confirm } from '@inquirer/prompts';
import {
  ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
  ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING,
} from '@/constants/issueCodes.js';
import { canAsk } from '@/core/ask/index.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue } from '@/types/core/json/envelope.js';

export const IDENTITY_STREAK_THRESHOLD = 8;

export class IdentityAbortError extends Error {
  constructor(
    public readonly command: string,
    public readonly target: string,
    public readonly threshold: number,
    public readonly path: string,
  ) {
    super(
      `${command}: aborted after ${String(threshold)} consecutive source-identical translations for ${target} (latest: ${path})`,
    );
    this.name = 'IdentityAbortError';
  }
}

function normalizeIdentityText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function isIdentityTranslation(sourceText: string, translatedText: string): boolean {
  return normalizeIdentityText(sourceText) === normalizeIdentityText(translatedText);
}

export type IdentityStreakState = {
  consecutiveIdentity: number;
  lastPath: string;
};

export function nextIdentityStreakState(
  state: IdentityStreakState,
  input: { sourceText: string; translatedText: string; path: string },
): IdentityStreakState {
  if (isIdentityTranslation(input.sourceText, input.translatedText)) {
    return {
      consecutiveIdentity: state.consecutiveIdentity + 1,
      lastPath: input.path,
    };
  }
  return {
    consecutiveIdentity: 0,
    lastPath: input.path,
  };
}

export function buildIdentityStreakIssue(params: {
  severity: 'warning' | 'error';
  target: string;
  count: number;
  path: string;
}): Issue {
  return {
    severity: params.severity,
    code:
      params.severity === 'error'
        ? ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT
        : ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING,
    message: `Target "${params.target}" produced ${String(params.count)} consecutive source-identical translations (latest path: ${params.path}).`,
    docPath: 'json/issue-codes',
  };
}

export function createIdentityStreakGuard(ctx: Context, command: string, target: string): {
  onTranslated: (sourceText: string, translatedText: string, path: string) => Promise<void>;
  flushIssues: () => Issue[];
} {
  let state: IdentityStreakState = { consecutiveIdentity: 0, lastPath: '' };
  const issues: Issue[] = [];
  return {
    async onTranslated(sourceText: string, translatedText: string, path: string): Promise<void> {
      state = nextIdentityStreakState(state, { sourceText, translatedText, path });
      if (state.consecutiveIdentity < IDENTITY_STREAK_THRESHOLD) return;
      if (state.consecutiveIdentity % IDENTITY_STREAK_THRESHOLD !== 0) return;
      issues.push(
        buildIdentityStreakIssue({
          severity: 'warning',
          target,
          count: state.consecutiveIdentity,
          path: state.lastPath || path,
        }),
      );
      if (getCliYesFlag()) return;
      if (!canAsk(ctx.run)) {
        throw new IdentityAbortError(command, target, IDENTITY_STREAK_THRESHOLD, state.lastPath || path);
      }
      const ok = await confirm({
        message: `${command}: ${String(state.consecutiveIdentity)} consecutive source-identical translations for ${target} (latest: ${state.lastPath || path}). Continue?`,
        default: false,
      });
      if (!ok) {
        throw new IdentityAbortError(command, target, IDENTITY_STREAK_THRESHOLD, state.lastPath || path);
      }
    },
    flushIssues(): Issue[] {
      return issues.slice();
    },
  };
}
