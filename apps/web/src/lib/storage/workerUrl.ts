import { WORKER_URL_STORAGE_KEY } from '../constants/storageKeys';

const DEFAULT_URL = 'http://127.0.0.1:8787';

export function readWorkerUrl(): string {
  try {
    const v = localStorage.getItem(WORKER_URL_STORAGE_KEY);
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_URL;
}

export function writeWorkerUrl(url: string): void {
  try {
    localStorage.setItem(WORKER_URL_STORAGE_KEY, url.trim());
  } catch {
    /* ignore */
  }
}
