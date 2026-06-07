import type { LocaleSuggestion } from '../types/suggestions/index.js';

/** Plain-text tip line for {@link emitRunMessage} (no ANSI). */
export function formatLocaleSuggestionHuman(suggestion: LocaleSuggestion): string {
  if (suggestion.commands.length === 0) return suggestion.message;
  return `${suggestion.message} → ${suggestion.commands[0]}`;
}
