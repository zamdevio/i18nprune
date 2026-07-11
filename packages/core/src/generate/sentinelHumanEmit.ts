import { DEFAULT_LIST_TOP, formatListOmittedSuffix } from '../shared/constants/listDisplay.js';
import {
  formatGenerateSentinelLeakNotice,
  formatSentinelRepairDetailLine,
  type SentinelRepairMode,
} from '../shared/placeholders/sentinelLeak.js';
import { emitRunMessage } from '../shared/run/index.js';
import type { RunEmitter } from '../types/shared/run/index.js';

export type GenerateSentinelRepairHumanRow = {
  path: string;
  mode: SentinelRepairMode;
  from: string;
  to?: string;
  sourceValue?: string;
};

/** Notice + bounded detail lines for generate sentinel repair (before progress bar when possible). */
export function emitGenerateSentinelRepairHumanMessages(
  emit: RunEmitter,
  runId: string | undefined,
  input: {
    repairs: readonly GenerateSentinelRepairHumanRow[];
    localeCode: string;
    dryRun: boolean;
    listLimit?: number;
  },
): void {
  if (input.repairs.length === 0) return;
  const copyCount = input.repairs.filter((repair) => repair.mode === 'placeholder_copy').length;
  const translateCount = input.repairs.filter((repair) => repair.mode === 'translate').length;
  emitRunMessage(emit, {
    op: 'generate',
    runId,
    level: 'notice',
    message: formatGenerateSentinelLeakNotice({
      localeCode: input.localeCode,
      copyCount,
      translateCount,
      dryRun: input.dryRun,
    }),
  });
  const listLimit = input.listLimit ?? DEFAULT_LIST_TOP;
  const shown = input.repairs.slice(0, listLimit);
  for (const repair of shown) {
    emitRunMessage(emit, {
      op: 'generate',
      runId,
      level: 'detail',
      message: formatSentinelRepairDetailLine({
        path: repair.path,
        mode: repair.mode,
        from: repair.from,
        to: repair.to ?? repair.sourceValue ?? '',
      }),
    });
  }
  const omitted = input.repairs.length - shown.length;
  if (omitted > 0) {
    emitRunMessage(emit, {
      op: 'generate',
      runId,
      level: 'detail',
      message: `  ${formatListOmittedSuffix(omitted)}`,
    });
  }
}
