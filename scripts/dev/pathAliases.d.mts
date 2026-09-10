/** Shared Vitest + tsup path aliases (implementation: pathAliases.mjs). */

export const root: string;
export const cliSrc: string;
export const coreSrc: string;

export function esbuildAliasMap(): Record<string, string>;

export function vitestAliasEntries(): Array<
  | { find: string; replacement: string }
  | { find: RegExp; replacement: string }
>;
