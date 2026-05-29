import type { GenerateFinalizeSummaryInput } from '../types/generate/generateRun.js';

/**
 * Stable human-readable finalize lines for generate (locale identity + write summary).
 * Hosts map {@link GenerateFinalizeSummaryInput.localeSubtitle} from catalog metadata; core owns wording only.
 */
export function formatGenerateFinalizeSummaryLines(input: GenerateFinalizeSummaryInput & {
  localeSubtitle: string;
}): string[] {
  const lines = [input.localeSubtitle];
  const multiSegment = (input.wroteSegmentCount ?? 1) > 1;
  if (input.dryRun) {
    if (multiSegment) {
      lines.push(
        `dry-run: no locale files written — would write ${String(input.wroteSegmentCount)} segment file(s) · ${String(input.leafCount)} leaves total.`,
      );
    } else {
      lines.push(
        `dry-run: no locale files written — would write ${input.targetPath} (${String(input.leafCount)} leaves).`,
      );
    }
    return lines;
  }
  if (multiSegment) {
    lines.push(
      `Wrote ${String(input.wroteSegmentCount)} segment file(s) · ${String(input.leafCount)} leaves total.`,
    );
    return lines;
  }
  lines.push(`Wrote ${input.targetPath} (${String(input.leafCount)} leaves).`);
  return lines;
}
