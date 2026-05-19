import { createBundledHighlighter } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import javascript from '@shikijs/langs/javascript';
import typescript from '@shikijs/langs/typescript';
import tsx from '@shikijs/langs/tsx';
import jsx from '@shikijs/langs/jsx';
import json from '@shikijs/langs/json';
import jsonc from '@shikijs/langs/jsonc';
import vue from '@shikijs/langs/vue';
import svelte from '@shikijs/langs/svelte';
import vitesseDark from '@shikijs/themes/vitesse-dark';
import vitesseLight from '@shikijs/themes/vitesse-light';

/**
 * Grammars aligned with `@i18nprune/core` default source scan (`tsx?|jsx?|mjs|cjs|vue|svelte`)
 * plus JSON / JSONC for locale files.
 */
export type ShikiLang =
  | 'javascript'
  | 'typescript'
  | 'tsx'
  | 'jsx'
  | 'json'
  | 'jsonc'
  | 'vue'
  | 'svelte';

const THEMES = ['vitesse-dark', 'vitesse-light'] as const;

const LANGS: ShikiLang[] = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'json',
  'jsonc',
  'vue',
  'svelte',
];

const createHighlighter = createBundledHighlighter({
  langs: {
    javascript: () => javascript,
    typescript: () => typescript,
    tsx: () => tsx,
    jsx: () => jsx,
    json: () => json,
    jsonc: () => jsonc,
    vue: () => vue,
    svelte: () => svelte,
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
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.vue')) return 'vue';
  if (lower.endsWith('.svelte')) return 'svelte';
  if (lower.endsWith('.ts') || lower.endsWith('.mts') || lower.endsWith('.cts')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  return 'typescript';
}

export function themeForMode(isDark: boolean): (typeof THEMES)[number] {
  return isDark ? 'vitesse-dark' : 'vitesse-light';
}
