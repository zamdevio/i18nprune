import type { HighlighterCore } from 'shiki/core';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bash from '@shikijs/langs/bash';
import typescript from '@shikijs/langs/typescript';
import githubDark from '@shikijs/themes/github-dark';
import githubLight from '@shikijs/themes/github-light';

let highlighterPromise: Promise<HighlighterCore> | null = null;

/**
 * Lazy singleton: only `bash` + `typescript` grammars and `github-dark` / `github-light`.
 * Grammars/themes are static imports so knip can trace `@shikijs/*` and `shiki` usage.
 */
export function getLandingHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      engine: createJavaScriptRegexEngine({ forgiving: true }),
      themes: [githubDark, githubLight],
      langs: [...bash, ...typescript],
    });
  }
  return highlighterPromise;
}

export function landingShikiTheme(): 'github-dark' | 'github-light' {
  if (typeof document === 'undefined') return 'github-light';
  return document.documentElement.classList.contains('dark') ? 'github-dark' : 'github-light';
}
