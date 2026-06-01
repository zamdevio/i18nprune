import { assertSyncPortResult } from '../../../runtime/helpers/sync/index.js';
import { readJsonFileWithLimit, textByteLength, writeJsonAtomic } from '../../../cache/io/helpers.js';
import { ISSUE_SHARE_JSON_REPAIRED, ISSUE_SHARE_JSON_WRITE_FAILED } from '../../../shared/constants/issueCodes.js';
import { DEFAULT_MAX_SHARE_JSON_BYTES, SHARE_JSON_BASENAME } from '../../../shared/constants/share.js';
import { backupAndRemoveCorruptShareJson, shareJsonBackupDetailEntries } from '../shareJsonBackup.js';
import type { CacheRuntime } from '../../../types/cache/index.js';
import type { Issue } from '../../../types/json/envelope/index.js';
import type { ShareCacheEntry, ShareJsonFile, ShareJsonHealKind, ShareJsonHealReport, LoadShareJsonResult } from '../../../types/share/index.js';
import type { SaveShareJsonResult } from '../../../types/share/cache.js';
import { normalizeShareCacheEntry, shareEntryRawNeedsIdRepair } from '../canonicalEntry.js';
import { shareJsonFileSchema } from '../schema.js';

function emptyShareFile(): ShareJsonFile {
  return { version: 1, entries: [] };
}

function healReport(): ShareJsonHealReport {
  return { repaired: false, actions: [], details: [] };
}

function pushHeal(heal: ShareJsonHealReport, kind: ShareJsonHealKind, detail: string): void {
  heal.repaired = true;
  heal.actions.push(kind);
  heal.details.push(detail);
}

function shareJsonRepairedIssue(heal: ShareJsonHealReport, sharePath: string): Issue {
  const intro =
    'share.json did not match the expected cache format (manual edits, duplicate rows, legacy worker id fields, or corrupt JSON). i18nprune repaired it and saved a canonical copy.';
  const guidance =
    'Do not edit share.json by hand — use `i18nprune share list`, `i18nprune share delete`, and `i18nprune share --project` / `--report` to manage rows.';
  const what =
    heal.details.length > 0 ? `What changed:\n${heal.details.map((d) => `• ${d}`).join('\n')}` : 'What changed: normalized entries to the current schema.';
  return {
    severity: 'warning',
    code: ISSUE_SHARE_JSON_REPAIRED,
    message: `${intro}\n\n${what}\n\n${guidance}`,
    path: sharePath,
  };
}

/**
 * Resolves `{projectDir}/share.json` using the host path port.
 */
export function resolveShareJsonPath(projectDir: string, path: { join: (...parts: string[]) => string }): string {
  return path.join(projectDir, SHARE_JSON_BASENAME);
}

function entryDedupeKey(e: ShareCacheEntry): string {
  const id = e.kind === 'project' ? e.workerProjectId ?? '' : e.workerReportId ?? '';
  return `${e.kind}\0${e.workerBaseUrl}\0${id}`;
}

/**
 * Merges duplicate worker rows (same kind + base URL + worker id), keeping the newest `lastUsedAt`.
 */
export function mergeDuplicateShareEntries(entries: ShareCacheEntry[]): { entries: ShareCacheEntry[]; merged: number } {
  const byKey = new Map<string, ShareCacheEntry>();
  let merged = 0;
  for (const e of entries) {
    const key = entryDedupeKey(e);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, e);
      continue;
    }
    merged += 1;
    if (e.lastUsedAt > prev.lastUsedAt) {
      byKey.set(key, e);
    }
  }
  return { entries: [...byKey.values()], merged };
}

function sanitizeUnknownTopLevel(raw: Record<string, unknown>): { stripped: Record<string, unknown>; removed: string[] } {
  const allowed = new Set(['version', 'entries']);
  const removed: string[] = [];
  const stripped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (allowed.has(k)) stripped[k] = v;
    else removed.push(k);
  }
  return { stripped, removed };
}

function parseAndHealEntries(rawEntries: unknown, heal: ShareJsonHealReport): ShareCacheEntry[] {
  if (!Array.isArray(rawEntries)) {
    pushHeal(heal, 'entries_sanitized', 'entries was not an array — replaced with [].');
    return [];
  }
  const out: ShareCacheEntry[] = [];
  let dropped = 0;
  let migratedFields = 0;
  for (const row of rawEntries) {
    const rawRecord =
      row && typeof row === 'object' && !Array.isArray(row) ? (row as Record<string, unknown>) : null;
    const one = shareJsonFileSchema.shape.entries.element.safeParse(row);
    if (one.success) {
      if (rawRecord && shareEntryRawNeedsIdRepair(rawRecord)) migratedFields += 1;
      out.push(one.data);
    } else {
      dropped += 1;
    }
  }
  if (migratedFields > 0) {
    pushHeal(
      heal,
      'entries_sanitized',
      migratedFields === 1
        ? 'Fixed 1 share.json row (moved worker id onto the correct project/report field).'
        : `Fixed ${String(migratedFields)} share.json rows (moved worker ids onto the correct fields).`,
    );
  }
  if (dropped > 0) {
    pushHeal(
      heal,
      'entries_sanitized',
      dropped === 1 ? 'Dropped 1 invalid share.json entry.' : `Dropped ${String(dropped)} invalid share.json entries.`,
    );
  }
  const { entries, merged } = mergeDuplicateShareEntries(out);
  if (merged > 0) {
    pushHeal(
      heal,
      'duplicates_merged',
      merged === 1 ? 'Merged 1 duplicate share cache row (same worker id).' : `Merged ${String(merged)} duplicate share cache rows.`,
    );
  }
  return entries;
}

function coerceShareFileFromUnknown(parsed: unknown, heal: ShareJsonHealReport): ShareJsonFile {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    pushHeal(heal, 'invalid_json', 'Root JSON was not an object — replaced with empty share file.');
    return emptyShareFile();
  }
  const raw = parsed as Record<string, unknown>;
  const { stripped, removed } = sanitizeUnknownTopLevel(raw);
  if (removed.length > 0) {
    pushHeal(
      heal,
      'entries_sanitized',
      `Removed unknown top-level share.json fields: ${removed.sort().join(', ')}`,
    );
  }
  const ver = stripped.version;
  if (ver !== 1) {
    pushHeal(
      heal,
      'version_reset',
      `share.json version was ${String(ver)} — reset to version 1 (only v1 is supported today).`,
    );
  }
  const entries = parseAndHealEntries(stripped.entries, heal);
  const candidate: ShareJsonFile = { version: 1, entries };
  const checked = shareJsonFileSchema.safeParse(candidate);
  if (!checked.success) {
    pushHeal(heal, 'entries_sanitized', `share.json failed final validation — cleared entries (${checked.error.message}).`);
    return emptyShareFile();
  }
  return checked.data;
}

function persistHealedShareFile(input: {
  sharePath: string;
  file: ShareJsonFile;
  runtime: CacheRuntime;
  cacheReadOnly?: boolean;
  issues: Issue[];
}): void {
  if (!input.cacheReadOnly) {
    const saved = saveShareJsonFile({
      sharePath: input.sharePath,
      file: input.file,
      runtime: input.runtime,
    });
    if (saved.warning) input.issues.push(saved.warning);
  }
}

function recordShareJsonBackup(heal: ShareJsonHealReport, backed: { created: boolean; bakPath?: string }): void {
  if (!backed.created || !backed.bakPath) return;
  heal.backupBakPath = backed.bakPath;
  heal.details.push(...shareJsonBackupDetailEntries(backed.bakPath));
}

/**
 * Loads `share.json` with self-heal: never throws; returns issues when repair occurred.
 */
export function loadShareJsonFile(input: {
  sharePath: string;
  runtime: CacheRuntime;
  maxBytes?: number;
  /** When true, skip writing healed `share.json` back to disk (e.g. cache read-only). */
  cacheReadOnly?: boolean;
}): LoadShareJsonResult {
  const { sharePath, runtime, cacheReadOnly } = input;
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_SHARE_JSON_BYTES;
  const heal = healReport();
  const issues: Issue[] = [];

  const exists = assertSyncPortResult(runtime.fs.exists(sharePath), 'fs.exists', sharePath);
  if (!exists) {
    heal.actions.push('missing_file');
    heal.details.push('share.json was missing — starting with an empty in-memory cache.');
    const file = emptyShareFile();
    return { file, heal, issues };
  }

  const { data, warning } = readJsonFileWithLimit<unknown>(sharePath, maxBytes, runtime);
  if (warning?.code === 'cache_oversize') {
    recordShareJsonBackup(heal, backupAndRemoveCorruptShareJson(sharePath, runtime));
    pushHeal(heal, 'oversized_file', warning.message);
    const file = emptyShareFile();
    issues.push(shareJsonRepairedIssue(heal, sharePath));
    persistHealedShareFile({ sharePath, file, runtime, cacheReadOnly, issues });
    return { file, heal, issues };
  }

  if (warning?.code === 'cache_malformed' || warning?.code === 'cache_io_error') {
    recordShareJsonBackup(heal, backupAndRemoveCorruptShareJson(sharePath, runtime));
    pushHeal(
      heal,
      'invalid_json',
      warning.message.includes('cache read') ? warning.message : `Invalid share.json: ${warning.message}`,
    );
    const file = emptyShareFile();
    issues.push(shareJsonRepairedIssue(heal, sharePath));
    persistHealedShareFile({ sharePath, file, runtime, cacheReadOnly, issues });
    return { file, heal, issues };
  }

  if (data === undefined) {
    const file = emptyShareFile();
    return { file, heal, issues };
  }

  const file = coerceShareFileFromUnknown(data, heal);
  if (heal.repaired) {
    issues.push(shareJsonRepairedIssue(heal, sharePath));
    persistHealedShareFile({ sharePath, file, runtime, cacheReadOnly, issues });
  }
  return { file, heal, issues };
}

/**
 * Writes `share.json` atomically. Does not create `share.bak/` copies — backups happen
 * only in {@link loadShareJsonFile} when the on-disk file is corrupt or oversize.
 */
export function saveShareJsonFile(input: {
  sharePath: string;
  file: ShareJsonFile;
  runtime: CacheRuntime;
}): SaveShareJsonResult {
  const { sharePath, runtime } = input;
  const file: ShareJsonFile = {
    version: input.file.version,
    entries: input.file.entries.map(normalizeShareCacheEntry),
  };
  const warn = writeJsonAtomic(sharePath, file, runtime);
  if (!warn) return {};
  return {
    warning: {
      severity: 'warning',
      code: ISSUE_SHARE_JSON_WRITE_FAILED,
      message: warn.message,
      path: sharePath,
    },
  };
}

/**
 * Byte length of serialized `share.json` (UTF-8) for diagnostics.
 */
export function shareJsonSerializedByteLength(file: ShareJsonFile, runtime: CacheRuntime): number {
  return textByteLength(JSON.stringify(file, null, 2), runtime);
}
