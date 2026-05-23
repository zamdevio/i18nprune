import { emitRunMessage } from '../../shared/run/index.js';
import type { ShareHumanMessageHost } from '../emit/host.js';
import type { ShareViewVerboseDetail, ShareViewVerboseSection } from '../../types/share/viewDetail.js';

const VERBOSE_SECTION_ORDER: (keyof ShareViewVerboseDetail)[] = [
  'processor',
  'extraction',
  'cache',
  'snapshot',
  'timings',
  'edge',
  'local',
  'links',
];

function shareVerboseHeader(host: ShareHumanMessageHost, message: string): void {
  emitRunMessage(host.emit, {
    op: 'share',
    runId: host.runId,
    level: 'info',
    channel: 'verbose',
    message,
  });
}

function shareVerboseDetailLine(host: ShareHumanMessageHost, message: string): void {
  emitRunMessage(host.emit, {
    op: 'share',
    runId: host.runId,
    level: 'detail',
    channel: 'verbose',
    message,
  });
}

function emitSection(host: ShareHumanMessageHost, title: string, section: ShareViewVerboseSection): void {
  shareVerboseHeader(host, `${title}:`);
  for (const [key, value] of Object.entries(section)) {
    shareVerboseDetailLine(host, `  ${key}=${String(value)}`);
  }
}

/** Emits structured verbose sections for `share view --verbose`. */
export function emitShareViewVerboseHumanMessages(host: ShareHumanMessageHost, detail: ShareViewVerboseDetail): void {
  shareVerboseHeader(host, '');
  for (const key of VERBOSE_SECTION_ORDER) {
    const section = detail[key];
    if (section && typeof section === 'object' && !Array.isArray(section)) {
      emitSection(host, key, section as ShareViewVerboseSection);
    }
  }
}
