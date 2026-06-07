import { emitRunMessage } from '../shared/run/index.js';
import { DEFAULT_LIST_TOP, formatListOmittedSuffix } from '../shared/constants/listDisplay.js';
import type { CleanupStringPresenceEvidence } from './stringPresence.js';
import type { CleanupHostHooks } from '../types/cleanup/index.js';

type CleanupMessageHost = Pick<CleanupHostHooks, 'emit' | 'runId'>;

export type CleanupEvidenceListWindow = {
  full: boolean;
  limit: number;
};

function formatLocationHint(locations: readonly string[], maxShown = 3): string {
  if (locations.length === 0) return '';
  const shown = locations.slice(0, maxShown);
  const tail = locations.length > maxShown ? ` (+${String(locations.length - maxShown)} more)` : '';
  return ` — e.g. ${shown.join(', ')}${tail}`;
}

/** Numbered verbose-detail lines for string-presence evidence (respects `--top` / `--full`). */
export function emitCleanupStringPresenceEvidence(
  host: CleanupMessageHost,
  evidence: readonly CleanupStringPresenceEvidence[],
  listWindow: CleanupEvidenceListWindow,
): void {
  const skipped = evidence.filter((ev) => ev.kind === 'guard_skipped');
  const warned = evidence.filter((ev) => ev.kind === 'warn_hit');
  if (skipped.length > 0) {
    emitEvidenceGroup(host, {
      label: 'string-presence guard skipped',
      items: skipped,
      listWindow,
      formatLine: (ev) =>
        `${ev.key} — probe text still in src (not proof of static key usage)${formatLocationHint(ev.locations)}`,
    });
  }
  if (warned.length > 0) {
    emitEvidenceGroup(host, {
      label: 'string-presence warn',
      items: warned,
      listWindow,
      formatLine: (ev) =>
        `${ev.key} — probe text in src (removal still allowed — reference.stringPresence=warn)${formatLocationHint(ev.locations)}`,
    });
  }
}

function emitEvidenceGroup(
  host: CleanupMessageHost,
  input: {
    label: string;
    items: readonly CleanupStringPresenceEvidence[];
    listWindow: CleanupEvidenceListWindow;
    formatLine: (ev: CleanupStringPresenceEvidence) => string;
  },
): void {
  const cap = input.listWindow.full ? input.items.length : input.listWindow.limit;
  const shown = input.items.slice(0, cap);
  const omitted = input.listWindow.full ? 0 : Math.max(0, input.items.length - shown.length);
  emitRunMessage(host.emit, {
    op: 'cleanup',
    runId: host.runId,
    level: 'info',
    message: `${input.label} ${String(input.items.length)} key(s)${omitted > 0 ? ` (showing ${String(shown.length)})` : ''}:`,
    data: { total: input.items.length, shown: shown.length },
  });
  for (let i = 0; i < shown.length; i += 1) {
    const ev = shown[i]!;
    emitRunMessage(host.emit, {
      op: 'cleanup',
      runId: host.runId,
      level: 'detail',
      channel: 'verbose',
      message: `  [${String(i + 1)}] ${input.formatLine(ev)}`,
      data: { key: ev.key, kind: ev.kind, index: i + 1 },
    });
  }
  if (omitted > 0) {
    emitRunMessage(host.emit, {
      op: 'cleanup',
      runId: host.runId,
      level: 'detail',
      channel: 'verbose',
      message: `  · ${String(shown.length)} key(s) shown + ${formatListOmittedSuffix(omitted)}`,
      data: { omitted },
    });
  }
}

export function resolveCleanupEvidenceListWindow(opts: {
  full?: boolean;
  top?: number;
}): CleanupEvidenceListWindow {
  return {
    full: opts.full === true,
    limit: opts.top ?? DEFAULT_LIST_TOP,
  };
}
