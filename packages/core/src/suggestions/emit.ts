import { emitRunMessage } from '../shared/run/index.js';
import type { OperationId } from '../types/shared/run/index.js';
import type { LocaleSuggestion } from '../types/suggestions/index.js';
import { buildLocaleSuggestions, type BuildLocaleSuggestionsInput } from './build.js';
import { formatLocaleSuggestionHuman } from './format.js';

export function emitLocaleSuggestions(
  host: { emit?: import('../types/shared/run/index.js').RunEmitter; runId?: string },
  op: OperationId,
  suggestions: readonly LocaleSuggestion[],
): void {
  for (const suggestion of suggestions) {
    emitRunMessage(host.emit, {
      op,
      runId: host.runId,
      level: 'tip',
      message: formatLocaleSuggestionHuman(suggestion),
      data: { suggestionId: suggestion.id },
    });
  }
}

/** Build suggestions, emit tips, and attach to a JSON payload. */
export function finalizeLocaleSuggestions<T extends Record<string, unknown>>(
  host: { emit?: import('../types/shared/run/index.js').RunEmitter; runId?: string },
  input: BuildLocaleSuggestionsInput,
  payload: T,
): T & { suggestions: LocaleSuggestion[] } {
  const suggestions = buildLocaleSuggestions(input);
  emitLocaleSuggestions(host, input.op, suggestions);
  return { ...payload, suggestions };
}
