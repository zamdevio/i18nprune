import {
  SHARE_HISTORY_DEFAULT_MAX,
  SHARE_HISTORY_EXPORT_SCHEMA_VERSION,
  SHARE_HISTORY_HARD_MAX,
} from '../constants/shareHistory.js';
import { SHARE_HISTORY_STORAGE_KEY } from '../constants/storageKeys.js';
import { buildHostedReportShareUrl } from '../lib/share/reportShareUrl.js';
import type {
  ReportAppSettings,
  ShareHistoryActivity,
  ShareHistoryEntry,
  ShareHistoryExportFile,
} from '../types/share/index.js';
import { clampMaxHistoryCount, readReportSettings, writeReportSettings } from './settings.js';

function readRawEntries(): ShareHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SHARE_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: ShareHistoryEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const o = item as Record<string, unknown>;
      const reportId = typeof o.reportId === 'string' ? o.reportId.trim() : '';
      if (!reportId) continue;
      const shareUrl = typeof o.shareUrl === 'string' ? o.shareUrl : buildHostedReportShareUrl(reportId);
      const workerBaseUrl = typeof o.workerBaseUrl === 'string' ? o.workerBaseUrl : '';
      const lastSeenAt = typeof o.lastSeenAt === 'string' ? o.lastSeenAt : new Date(0).toISOString();
      const activitiesRaw = o.activities;
      const activities: ShareHistoryActivity[] = [];
      if (Array.isArray(activitiesRaw)) {
        for (const a of activitiesRaw) {
          if (a === 'viewed' || a === 'shared') activities.push(a);
        }
      }
      if (activities.length === 0) activities.push('viewed');
      out.push({
        reportId,
        shareUrl,
        workerBaseUrl,
        activities,
        lastSeenAt,
        ...(typeof o.toolVersion === 'string' ? { toolVersion: o.toolVersion } : {}),
        ...(typeof o.generatedAt === 'string' ? { generatedAt: o.generatedAt } : {}),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function writeRawEntries(entries: ShareHistoryEntry[]): void {
  try {
    localStorage.setItem(SHARE_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota */
  }
}

function mergeActivity(existing: ShareHistoryActivity[], next: ShareHistoryActivity): ShareHistoryActivity[] {
  const set = new Set(existing);
  set.add(next);
  return [...set];
}

function sortByLastSeen(entries: ShareHistoryEntry[]): ShareHistoryEntry[] {
  return [...entries].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

function trimToMax(entries: ShareHistoryEntry[], max: number): ShareHistoryEntry[] {
  return sortByLastSeen(entries).slice(0, max);
}

export function listShareHistory(): ShareHistoryEntry[] {
  const max = readReportSettings().maxHistoryCount;
  return trimToMax(readRawEntries(), max);
}

export function clearShareHistory(): void {
  writeRawEntries([]);
}

export function removeShareHistoryEntry(reportId: string): void {
  const id = reportId.trim();
  writeRawEntries(readRawEntries().filter((e) => e.reportId !== id));
}

export type RecordShareHistoryInput = {
  reportId: string;
  workerBaseUrl: string;
  activity: ShareHistoryActivity;
  toolVersion?: string;
  generatedAt?: string;
  shareUrl?: string;
};

export function recordShareHistory(input: RecordShareHistoryInput): ShareHistoryEntry[] {
  const reportId = input.reportId.trim();
  if (!reportId) return listShareHistory();
  const now = new Date().toISOString();
  const max = readReportSettings().maxHistoryCount;
  const shareUrl = input.shareUrl?.trim() || buildHostedReportShareUrl(reportId);
  const existing = readRawEntries();
  const idx = existing.findIndex((e) => e.reportId === reportId);
  let next: ShareHistoryEntry;
  if (idx >= 0) {
    const prev = existing[idx]!;
    next = {
      ...prev,
      shareUrl,
      workerBaseUrl: input.workerBaseUrl.trim() || prev.workerBaseUrl,
      activities: mergeActivity(prev.activities, input.activity),
      lastSeenAt: now,
      ...(input.toolVersion ? { toolVersion: input.toolVersion } : {}),
      ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}),
    };
    existing.splice(idx, 1);
  } else {
    next = {
      reportId,
      shareUrl,
      workerBaseUrl: input.workerBaseUrl.trim(),
      activities: [input.activity],
      lastSeenAt: now,
      ...(input.toolVersion ? { toolVersion: input.toolVersion } : {}),
      ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}),
    };
  }
  const merged = trimToMax([next, ...existing], max);
  writeRawEntries(merged);
  return merged;
}

export function exportShareHistoryBundle(): ShareHistoryExportFile {
  return {
    schemaVersion: SHARE_HISTORY_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: readReportSettings(),
    entries: readRawEntries(),
  };
}

export function validateShareHistoryExport(data: unknown): ShareHistoryExportFile {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Import file must be a JSON object.');
  }
  const o = data as Record<string, unknown>;
  if (o.schemaVersion !== SHARE_HISTORY_EXPORT_SCHEMA_VERSION) {
    throw new Error(`Unsupported export schemaVersion (expected ${String(SHARE_HISTORY_EXPORT_SCHEMA_VERSION)}).`);
  }
  const settingsRaw = o.settings;
  if (!settingsRaw || typeof settingsRaw !== 'object' || Array.isArray(settingsRaw)) {
    throw new Error('Import file is missing settings.');
  }
  const maxHistoryCount = clampMaxHistoryCount(
    typeof (settingsRaw as Record<string, unknown>).maxHistoryCount === 'number'
      ? ((settingsRaw as Record<string, unknown>).maxHistoryCount as number)
      : SHARE_HISTORY_DEFAULT_MAX,
  );
  const entriesRaw = o.entries;
  if (!Array.isArray(entriesRaw)) {
    throw new Error('Import file is missing entries array.');
  }
  const entries: ShareHistoryEntry[] = [];
  for (const item of entriesRaw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const reportId = typeof row.reportId === 'string' ? row.reportId.trim() : '';
    if (!/^[a-f0-9]{16}$/i.test(reportId)) continue;
    const activityList: ShareHistoryActivity[] = [];
    if (Array.isArray(row.activities)) {
      for (const a of row.activities) {
        if (a === 'viewed' || a === 'shared') activityList.push(a);
      }
    }
    if (activityList.length === 0) activityList.push('viewed');
    entries.push({
      reportId,
      shareUrl: typeof row.shareUrl === 'string' ? row.shareUrl : buildHostedReportShareUrl(reportId),
      workerBaseUrl: typeof row.workerBaseUrl === 'string' ? row.workerBaseUrl : '',
      activities: activityList,
      lastSeenAt: typeof row.lastSeenAt === 'string' ? row.lastSeenAt : new Date(0).toISOString(),
      ...(typeof row.toolVersion === 'string' ? { toolVersion: row.toolVersion } : {}),
      ...(typeof row.generatedAt === 'string' ? { generatedAt: row.generatedAt } : {}),
    });
  }
  return {
    schemaVersion: SHARE_HISTORY_EXPORT_SCHEMA_VERSION,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
    settings: { maxHistoryCount },
    entries,
  };
}

export function importShareHistoryBundle(
  file: ShareHistoryExportFile,
  mode: 'replace' | 'merge',
): { settings: ReportAppSettings; entries: ShareHistoryEntry[] } {
  const max = file.settings.maxHistoryCount;
  if (max > SHARE_HISTORY_HARD_MAX) {
    throw new Error(`maxHistoryCount cannot exceed ${String(SHARE_HISTORY_HARD_MAX)}.`);
  }
  writeReportSettings(file.settings);
  const cap = readReportSettings().maxHistoryCount;
  let entries: ShareHistoryEntry[];
  if (mode === 'replace') {
    entries = trimToMax(file.entries, cap);
  } else {
    const map = new Map<string, ShareHistoryEntry>();
    for (const e of readRawEntries()) map.set(e.reportId, e);
    for (const e of file.entries) {
      const prev = map.get(e.reportId);
      if (!prev) {
        map.set(e.reportId, e);
        continue;
      }
      map.set(e.reportId, {
        ...prev,
        ...e,
        activities: mergeActivity(prev.activities, e.activities[0] ?? 'viewed'),
        lastSeenAt: e.lastSeenAt > prev.lastSeenAt ? e.lastSeenAt : prev.lastSeenAt,
      });
    }
    entries = trimToMax([...map.values()], cap);
  }
  writeRawEntries(entries);
  return { settings: readReportSettings(), entries: listShareHistory() };
}

export function shareHistoryStats(): { count: number; max: number } {
  const max = readReportSettings().maxHistoryCount;
  return { count: readRawEntries().length, max };
}
