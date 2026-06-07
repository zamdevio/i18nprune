import type { LocaleSuggestion } from '../types/suggestions/index.js';

function segmentLines(segmentPaths: readonly string[] | undefined): string[] {
  if (!segmentPaths?.length) return [];
  const shown = segmentPaths.slice(0, 3);
  const tail = segmentPaths.length > 3 ? ` (+${String(segmentPaths.length - 3)} more)` : '';
  return [`     ${shown.join(' · ')}${tail}`];
}

/** Plain-text tip body for {@link emitRunMessage} (no ANSI). Multi-line when segment paths or commands warrant it. */
export function formatLocaleSuggestionHuman(suggestion: LocaleSuggestion): string {
  const lines = [suggestion.message];
  lines.push(...segmentLines(suggestion.data?.segmentPaths));
  if (suggestion.commands.length === 0) return lines.join('\n');
  for (const command of suggestion.commands) {
    lines.push(`     → ${command}`);
  }
  return lines.join('\n');
}
