import type {
  RecentProjectZipBundleManifest,
  RecentProjectZipBundleManifestItem,
  RecentProjectZipEntry,
  RecentProjectZipSettings,
} from '../types/index.js';
import { RECENT_PROJECT_ZIPS_META_KEY, RECENT_PROJECT_ZIPS_SETTINGS_KEY } from '../constants/index.js';
import { sha256Hex } from '../project/index.js';
import { unzipSync, zipSync } from 'fflate';

const DB_NAME = 'i18nprune-runtime-web';
const STORE_NAME = 'recent-project-zips';
const DB_VERSION = 1;
/** Root manifest inside export zips. */
const EXPORT_MANIFEST = 'manifest.json';
const DEFAULT_MAX = 100;
const MAX_ALLOWED = 1000;
const DEFAULT_MAX_TOTAL_MB = 512;

function assertNoUnknownKeys(input: Record<string, unknown>, allowed: string[], context: string): void {
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) {
      throw new Error(`${context} has unknown key: ${key}`);
    }
  }
}

/** Normalize paths inside an export zip (slash style, strip `./`, no leading slash). */
function normalizeBundlePath(entryPath: string): string {
  let p = entryPath.replace(/\\/g, '/');
  while (p.startsWith('./')) p = p.slice(2);
  return p.replace(/^\/+/, '');
}

function normalizeBundleFiles(
  files: Record<string, Uint8Array>,
): { ok: true; map: Record<string, Uint8Array> } | { ok: false; message: string } {
  const map: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(files)) {
    const nk = normalizeBundlePath(k);
    if (nk.endsWith('/')) continue;
    if (map[nk] !== undefined) {
      return { ok: false, message: `Invalid bundle: duplicate path after normalization (${nk}).` };
    }
    map[nk] = v;
  }
  return { ok: true, map };
}

const MANIFEST_ITEM_KEYS = ['id', 'name', 'size', 'createdAt', 'sha256', 'workerProjectId'] as const;

function clampMaxCount(input: number): number {
  if (!Number.isFinite(input)) return DEFAULT_MAX;
  const floored = Math.floor(input);
  if (floored < 0) return 0;
  return Math.min(floored, MAX_ALLOWED);
}

function clampMaxTotalMb(input: number): number {
  if (!Number.isFinite(input)) return DEFAULT_MAX_TOTAL_MB;
  const floored = Math.floor(input);
  if (floored < 0) return 0;
  return Math.min(floored, 20_000);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB.'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const value = await run(store);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
    });
    return value;
  } finally {
    db.close();
  }
}

function loadMeta(): RecentProjectZipEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_PROJECT_ZIPS_META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: RecentProjectZipEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === 'string' ? o.id : null;
      const name = typeof o.name === 'string' ? o.name : null;
      const size = typeof o.size === 'number' ? o.size : null;
      const createdAt = typeof o.createdAt === 'number' ? o.createdAt : null;
      if (!id || !name || size === null || createdAt === null) continue;
      const sha256 = typeof o.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(o.sha256) ? o.sha256.toLowerCase() : undefined;
      out.push({ id, name, size, createdAt, ...(sha256 ? { sha256 } : {}) });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveMeta(entries: RecentProjectZipEntry[]): void {
  try {
    localStorage.setItem(RECENT_PROJECT_ZIPS_META_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function readRecentProjectZipSettings(): RecentProjectZipSettings {
  try {
    const raw = localStorage.getItem(RECENT_PROJECT_ZIPS_SETTINGS_KEY);
    if (!raw) return { enabled: true, maxCount: DEFAULT_MAX, defaultMode: 'ask', maxTotalMb: DEFAULT_MAX_TOTAL_MB };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { enabled: true, maxCount: DEFAULT_MAX, defaultMode: 'ask', maxTotalMb: DEFAULT_MAX_TOTAL_MB };
    }
    const o = parsed as Record<string, unknown>;
    const enabled = typeof o.enabled === 'boolean' ? o.enabled : true;
    const maxCount = clampMaxCount(typeof o.maxCount === 'number' ? o.maxCount : DEFAULT_MAX);
    const defaultMode =
      o.defaultMode === 'local' || o.defaultMode === 'remote' || o.defaultMode === 'ask' ? o.defaultMode : 'ask';
    const maxTotalMb = clampMaxTotalMb(typeof o.maxTotalMb === 'number' ? o.maxTotalMb : DEFAULT_MAX_TOTAL_MB);
    return { enabled, maxCount, defaultMode, maxTotalMb };
  } catch {
    return { enabled: true, maxCount: DEFAULT_MAX, defaultMode: 'ask', maxTotalMb: DEFAULT_MAX_TOTAL_MB };
  }
}

function writeRecentProjectZipSettings(settings: RecentProjectZipSettings): void {
  try {
    localStorage.setItem(RECENT_PROJECT_ZIPS_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export async function updateRecentProjectZipSettings(next: Partial<RecentProjectZipSettings>): Promise<RecentProjectZipSettings> {
  const cur = readRecentProjectZipSettings();
  const merged: RecentProjectZipSettings = {
    enabled: typeof next.enabled === 'boolean' ? next.enabled : cur.enabled,
    maxCount: clampMaxCount(typeof next.maxCount === 'number' ? next.maxCount : cur.maxCount),
    defaultMode:
      next.defaultMode === 'local' || next.defaultMode === 'remote' || next.defaultMode === 'ask'
        ? next.defaultMode
        : cur.defaultMode,
    maxTotalMb: clampMaxTotalMb(typeof next.maxTotalMb === 'number' ? next.maxTotalMb : cur.maxTotalMb),
  };
  writeRecentProjectZipSettings(merged);
  if (!merged.enabled || merged.maxCount === 0) {
    await clearRecentProjectZips();
  } else {
    await enforceRecentProjectZipLimit(merged.maxCount, merged.maxTotalMb);
  }
  return merged;
}

function makeId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function listRecentProjectZips(): RecentProjectZipEntry[] {
  return loadMeta();
}

export function searchRecentProjectZips(query: string): RecentProjectZipEntry[] {
  const q = query.trim().toLowerCase();
  const all = listRecentProjectZips();
  if (!q) return all;
  return all.filter(
    (x) =>
      x.name.toLowerCase().includes(q) ||
      x.id.toLowerCase().includes(q) ||
      (x.sha256 !== undefined && x.sha256.includes(q)),
  );
}

/** Most recent cached entry whose stored zip matches this SHA-256 (hex), if any. */
export function findRecentProjectZipBySha256(hex: string): RecentProjectZipEntry | null {
  const norm = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(norm)) return null;
  const all = loadMeta().sort((a, b) => b.createdAt - a.createdAt);
  return all.find((x) => x.sha256 === norm) ?? null;
}

export async function saveRecentProjectZip(file: File): Promise<RecentProjectZipEntry | null> {
  const settings = readRecentProjectZipSettings();
  if (!settings.enabled || settings.maxCount === 0) return null;
  if (settings.maxTotalMb <= 0) return null;
  if (file.size > settings.maxTotalMb * 1024 * 1024) {
    throw new Error(
      `Zip is ${(file.size / 1024 / 1024).toFixed(2)}MB but cache quota is ${String(settings.maxTotalMb)}MB.`,
    );
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(buf);
  const metaBefore = loadMeta();
  const dupes = metaBefore.filter((x) => x.sha256 === sha256);
  if (dupes.length > 0) {
    await withStore('readwrite', (store) => {
      for (const d of dupes) {
        store.delete(d.id);
      }
    });
    saveMeta(metaBefore.filter((x) => x.sha256 !== sha256));
  }
  const id = makeId();
  const blob = new Blob([buf], { type: 'application/zip' });
  await withStore('readwrite', (store) => {
    store.put(blob, id);
  });
  const entry: RecentProjectZipEntry = {
    id,
    name: file.name,
    size: file.size,
    createdAt: Date.now(),
    sha256,
  };
  const next = [entry, ...loadMeta()];
  saveMeta(next);
  await enforceRecentProjectZipLimit(settings.maxCount, settings.maxTotalMb);
  return entry;
}

export async function loadRecentProjectZipFile(entryId: string): Promise<File | null> {
  const entry = loadMeta().find((x) => x.id === entryId);
  if (!entry) return null;
  const blob = await withStore('readonly', (store) => {
    const req = store.get(entryId);
    return new Promise<Blob | null>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('Failed to read cached zip.'));
    });
  });
  if (!blob) return null;
  return new File([blob], entry.name, { type: 'application/zip' });
}

export async function deleteRecentProjectZip(entryId: string): Promise<void> {
  await withStore('readwrite', (store) => {
    store.delete(entryId);
  });
  saveMeta(loadMeta().filter((x) => x.id !== entryId));
}

export async function clearRecentProjectZips(): Promise<void> {
  await withStore('readwrite', (store) => {
    store.clear();
  });
  saveMeta([]);
}

export function summarizeTrimPreview(nextMaxCount: number): { totalDelete: number; sample: string[]; moreCount: number } {
  const all = loadMeta().sort((a, b) => b.createdAt - a.createdAt);
  const remove = all.slice(clampMaxCount(nextMaxCount));
  return {
    totalDelete: remove.length,
    sample: remove.slice(0, 3).map((x) => x.name),
    moreCount: Math.max(0, remove.length - 3),
  };
}

export function getRecentProjectZipStats(): { count: number; totalBytes: number } {
  const all = loadMeta();
  return {
    count: all.length,
    totalBytes: all.reduce((sum, x) => sum + x.size, 0),
  };
}

export async function enforceRecentProjectZipLimit(limit: number, maxTotalMb?: number): Promise<void> {
  const clamped = clampMaxCount(limit);
  const maxBytes = typeof maxTotalMb === 'number' ? clampMaxTotalMb(maxTotalMb) * 1024 * 1024 : Number.POSITIVE_INFINITY;
  const all = loadMeta().sort((a, b) => b.createdAt - a.createdAt);
  const keep: RecentProjectZipEntry[] = [];
  const remove: RecentProjectZipEntry[] = [];
  let runningBytes = 0;
  for (const item of all) {
    const canKeepCount = keep.length < clamped;
    const canKeepBytes = runningBytes + item.size <= maxBytes;
    if (canKeepCount && canKeepBytes) {
      keep.push(item);
      runningBytes += item.size;
    } else {
      remove.push(item);
    }
  }
  if (remove.length > 0) {
    await withStore('readwrite', (store) => {
      for (const item of remove) {
        store.delete(item.id);
      }
    });
  }
  saveMeta(keep);
}

export async function exportRecentProjectZipBundle(): Promise<File> {
  const itemsSorted = loadMeta().sort((a, b) => b.createdAt - a.createdAt);
  const map: Record<string, Uint8Array> = {};
  const manifestItems: RecentProjectZipBundleManifestItem[] = [];
  for (const item of itemsSorted) {
    const file = await loadRecentProjectZipFile(item.id);
    if (!file) continue;
    const buf = new Uint8Array(await file.arrayBuffer());
    const sha256 = item.sha256 ?? (await sha256Hex(buf));
    manifestItems.push({
      id: item.id,
      name: item.name,
      size: buf.byteLength,
      createdAt: item.createdAt,
      sha256,
    });
    map[`zips/${item.id}.zip`] = buf;
  }
  const manifest: RecentProjectZipBundleManifest = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: readRecentProjectZipSettings(),
    items: manifestItems,
  };
  map[EXPORT_MANIFEST] = new TextEncoder().encode(JSON.stringify(manifest, null, 2));
  const bytes = zipSync(map, { level: 6 });
  return new File([new Uint8Array(bytes)], `i18nprune-export-${Date.now()}.zip`, { type: 'application/zip' });
}

export async function validateRecentProjectZipBundle(bundleZip: File): Promise<{
  ok: true;
  manifest: RecentProjectZipBundleManifest;
  zipCount: number;
} | { ok: false; message: string }> {
  const bytes = new Uint8Array(await bundleZip.arrayBuffer());
  let rawFiles: Record<string, Uint8Array>;
  try {
    rawFiles = unzipSync(bytes);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? `Invalid ZIP: ${e.message}` : 'Invalid ZIP file.' };
  }
  const normalized = normalizeBundleFiles(rawFiles);
  if (!normalized.ok) return normalized;
  const files = normalized.map;

  const manifestRaw = files[EXPORT_MANIFEST];
  if (!manifestRaw) {
    return { ok: false, message: `Invalid bundle: missing ${EXPORT_MANIFEST} at archive root.` };
  }
  let manifestUnknown: unknown;
  try {
    manifestUnknown = JSON.parse(new TextDecoder().decode(manifestRaw)) as unknown;
  } catch (e) {
    return { ok: false, message: e instanceof Error ? `Invalid manifest JSON: ${e.message}` : 'Invalid manifest JSON.' };
  }
  if (!manifestUnknown || typeof manifestUnknown !== 'object' || Array.isArray(manifestUnknown)) {
    return { ok: false, message: 'Invalid manifest shape: expected object.' };
  }
  const manifestObj = manifestUnknown as Record<string, unknown>;
  try {
    assertNoUnknownKeys(manifestObj, ['version', 'exportedAt', 'settings', 'items'], 'manifest');
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
  if (manifestObj.version !== 1) {
    return {
      ok: false,
      message: `Invalid manifest version (expected 1, got ${String(manifestObj.version)}).`,
    };
  }
  if (typeof manifestObj.exportedAt !== 'string') {
    return { ok: false, message: 'Invalid manifest exportedAt.' };
  }
  if (!manifestObj.settings || typeof manifestObj.settings !== 'object' || Array.isArray(manifestObj.settings)) {
    return { ok: false, message: 'Invalid manifest settings.' };
  }
  if (!Array.isArray(manifestObj.items)) {
    return { ok: false, message: 'Invalid manifest items list.' };
  }
  const settingsObj = manifestObj.settings as Record<string, unknown>;
  try {
    assertNoUnknownKeys(settingsObj, ['enabled', 'maxCount', 'defaultMode', 'maxTotalMb'], 'manifest.settings');
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
  const items: RecentProjectZipBundleManifestItem[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < manifestObj.items.length; i += 1) {
    const item = manifestObj.items[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, message: `Invalid manifest item at index ${String(i)}.` };
    }
    const rec = item as Record<string, unknown>;
    try {
      assertNoUnknownKeys(rec, [...MANIFEST_ITEM_KEYS], `manifest.items[${String(i)}]`);
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
    if (
      typeof rec.id !== 'string' ||
      rec.id.length === 0 ||
      typeof rec.name !== 'string' ||
      typeof rec.size !== 'number' ||
      typeof rec.createdAt !== 'number'
    ) {
      return { ok: false, message: `Invalid manifest item fields at index ${String(i)}.` };
    }
    if (rec.id.includes('/') || rec.id.includes('\\')) {
      return { ok: false, message: `Invalid manifest item id at index ${String(i)} (path characters).` };
    }
    if (seenIds.has(rec.id)) {
      return { ok: false, message: `Duplicate manifest item id: ${rec.id}` };
    }
    seenIds.add(rec.id);
    if (!Number.isFinite(rec.size) || rec.size < 0 || !Number.isInteger(rec.size)) {
      return { ok: false, message: `Invalid manifest item size at index ${String(i)}.` };
    }
    if (!Number.isFinite(rec.createdAt)) {
      return { ok: false, message: `Invalid manifest item createdAt at index ${String(i)}.` };
    }
    if (rec.workerProjectId !== undefined && typeof rec.workerProjectId !== 'string') {
      return { ok: false, message: `Invalid manifest item workerProjectId at index ${String(i)}.` };
    }
    if (typeof rec.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(rec.sha256)) {
      return { ok: false, message: `Manifest item at index ${String(i)} requires a valid sha256 (64 hex chars).` };
    }
    const itemSha = rec.sha256.toLowerCase();
    const zipPath = `zips/${rec.id}.zip`;
    const zipBytes = files[zipPath];
    if (!zipBytes) {
      return { ok: false, message: `Missing zip payload for manifest item: ${rec.id}` };
    }
    if (zipBytes.byteLength !== rec.size) {
      return {
        ok: false,
        message: `Zip size mismatch for ${rec.id}: manifest declares ${String(rec.size)} bytes, archive has ${String(zipBytes.byteLength)}.`,
      };
    }
    const hash = await sha256Hex(zipBytes);
    if (hash !== itemSha) {
      return { ok: false, message: `SHA-256 mismatch for manifest item ${rec.id} (${rec.name}).` };
    }
    items.push({
      id: rec.id,
      name: rec.name,
      size: rec.size,
      createdAt: rec.createdAt,
      sha256: itemSha,
    });
  }

  const allowedPaths = new Set<string>([EXPORT_MANIFEST]);
  for (const it of items) {
    allowedPaths.add(`zips/${it.id}.zip`);
  }
  for (const p of Object.keys(files)) {
    if (!allowedPaths.has(p)) {
      return { ok: false, message: `Unexpected file in bundle: ${p}` };
    }
  }

  const manifest: RecentProjectZipBundleManifest = {
    version: 1,
    exportedAt: manifestObj.exportedAt,
    settings: {
      enabled: Boolean(settingsObj.enabled),
      maxCount: clampMaxCount(Number(settingsObj.maxCount ?? DEFAULT_MAX)),
      defaultMode:
        settingsObj.defaultMode === 'local' || settingsObj.defaultMode === 'remote' || settingsObj.defaultMode === 'ask'
          ? settingsObj.defaultMode
          : 'ask',
      maxTotalMb: clampMaxTotalMb(Number(settingsObj.maxTotalMb ?? DEFAULT_MAX_TOTAL_MB)),
    },
    items,
  };
  return { ok: true, manifest, zipCount: items.length };
}

export async function importRecentProjectZipBundle(bundleZip: File): Promise<{ imported: number }> {
  const validation = await validateRecentProjectZipBundle(bundleZip);
  if (!validation.ok) throw new Error(validation.message);
  const normalized = normalizeBundleFiles(unzipSync(new Uint8Array(await bundleZip.arrayBuffer())));
  if (!normalized.ok) throw new Error(normalized.message);
  const files = normalized.map;
  const manifest = validation.manifest;
  let imported = 0;
  await withStore('readwrite', (store) => {
    const existingIds = new Set(loadMeta().map((x) => x.id));
    const meta = loadMeta();
    for (const item of manifest.items) {
      const path = `zips/${item.id}.zip`;
      const data = files[path];
      if (!data) {
        throw new Error(`Import failed: missing ${path} after validation (internal error).`);
      }
      const id = existingIds.has(item.id) ? makeId() : item.id;
      existingIds.add(id);
      const blob = new Blob([new Uint8Array(data)], { type: 'application/zip' });
      store.put(blob, id);
      meta.unshift({
        id,
        name: item.name,
        size: item.size,
        createdAt: item.createdAt,
        sha256: item.sha256,
      });
      imported += 1;
    }
    saveMeta(meta.sort((a, b) => b.createdAt - a.createdAt));
  });
  const settings = readRecentProjectZipSettings();
  await enforceRecentProjectZipLimit(settings.maxCount, settings.maxTotalMb);
  return { imported };
}
