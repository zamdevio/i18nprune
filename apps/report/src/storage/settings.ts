import { SHARE_HISTORY_DEFAULT_MAX, SHARE_HISTORY_HARD_MAX } from '../constants/shareHistory.js';
import { REPORT_SETTINGS_STORAGE_KEY } from '../constants/storageKeys.js';
import type { ReportAppSettings } from '../types/share/index.js';

function clampMaxHistoryCount(n: number): number {
  if (!Number.isFinite(n)) return SHARE_HISTORY_DEFAULT_MAX;
  const floored = Math.floor(n);
  if (floored < 1) return 1;
  return Math.min(floored, SHARE_HISTORY_HARD_MAX);
}

export function readReportSettings(): ReportAppSettings {
  try {
    const raw = localStorage.getItem(REPORT_SETTINGS_STORAGE_KEY);
    if (!raw) return { maxHistoryCount: SHARE_HISTORY_DEFAULT_MAX };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { maxHistoryCount: SHARE_HISTORY_DEFAULT_MAX };
    }
    const max = (parsed as Record<string, unknown>).maxHistoryCount;
    return { maxHistoryCount: clampMaxHistoryCount(typeof max === 'number' ? max : SHARE_HISTORY_DEFAULT_MAX) };
  } catch {
    return { maxHistoryCount: SHARE_HISTORY_DEFAULT_MAX };
  }
}

export function writeReportSettings(settings: ReportAppSettings): ReportAppSettings {
  const next = { maxHistoryCount: clampMaxHistoryCount(settings.maxHistoryCount) };
  try {
    localStorage.setItem(REPORT_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

export { clampMaxHistoryCount };
