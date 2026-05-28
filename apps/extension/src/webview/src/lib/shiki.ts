import { createBundledHighlighter } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import vitesseDark from '@shikijs/themes/vitesse-dark';
import vitesseLight from '@shikijs/themes/vitesse-light';

/**
 * Grammars aligned with `@i18nprune/core` default source scan (`tsx?|jsx?|mjs|cjs|vue|svelte`)
 * plus JSON / JSONC for locale files.
 */
export type ShikiLang =
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'jsonc';

const THEMES = ['vitesse-dark', 'vitesse-light'] as const;

const LANGS: ShikiLang[] = [
  'javascript',
  'typescript',
  'json',
  'jsonc',
];

const createHighlighter = createBundledHighlighter({
  langs: {
    javascript: () => import('@shikijs/langs/javascript').then((m) => m.default),
    typescript: () => import('@shikijs/langs/typescript').then((m) => m.default),
    json: () => import('@shikijs/langs/json').then((m) => m.default),
    jsonc: () => import('@shikijs/langs/jsonc').then((m) => m.default),
  },
  themes: {
    'vitesse-dark': () => vitesseDark,
    'vitesse-light': () => vitesseLight,
  },
  engine: () => createJavaScriptRegexEngine(),
});

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

export function getI18npruneHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: [...THEMES],
    langs: [...LANGS],
  });
  return highlighterPromise;
}

export function fileNameToShikiLang(fileName: string): ShikiLang {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.jsonc')) return 'jsonc';
  if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) return 'typescript';
  if (lower.endsWith('.vue') || lower.endsWith('.svelte')) return 'typescript';
  if (lower.endsWith('.ts') || lower.endsWith('.mts') || lower.endsWith('.cts')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  return 'typescript';
}

export function themeForMode(isDark: boolean): (typeof THEMES)[number] {
  return isDark ? 'vitesse-dark' : 'vitesse-light';
}
