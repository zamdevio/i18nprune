import type { HighlighterCore } from 'shiki/core';

let highlighterPromise: Promise<HighlighterCore> | null = null;

/**
 * Lazy, fine-grained Shiki: only `bash` + `typescript` grammars and `github-dark` / `github-light`
 * (dynamic `import()` so Vite emits a separate async chunk — not in the initial landing JS).
 */
export function getLandingHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        { default: bash },
        { default: typescript },
        { default: githubDark },
        { default: githubLight },
      ] = await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
        import('@shikijs/langs/bash'),
        import('@shikijs/langs/typescript'),
        import('@shikijs/themes/github-dark'),
        import('@shikijs/themes/github-light'),
      ]);
      return createHighlighterCore({
        engine: createJavaScriptRegexEngine({ forgiving: true }),
        themes: [githubDark, githubLight],
        langs: [...bash, ...typescript],
      });
    })();
  }
  return highlighterPromise;
}

export function landingShikiTheme(): 'github-dark' | 'github-light' {
  if (typeof document === 'undefined') return 'github-light';
  return document.documentElement.classList.contains('dark') ? 'github-dark' : 'github-light';
}
