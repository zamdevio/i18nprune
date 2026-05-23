import { DEFAULT_WORKER_API_URL } from '@i18nprune/core';
import { WORKER_URL_STORAGE_KEY } from '../constants/index.js';

export function readWorkerUrl(): string {
  try {
    const v = localStorage.getItem(WORKER_URL_STORAGE_KEY);
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_WORKER_API_URL;
}

export function writeWorkerUrl(url: string): void {
  try {
    localStorage.setItem(WORKER_URL_STORAGE_KEY, url.trim());
  } catch {
    /* ignore */
  }
}

/** Persist and return the production default worker origin. */
export function resetWorkerUrlToDefault(): string {
  writeWorkerUrl(DEFAULT_WORKER_API_URL);
  return DEFAULT_WORKER_API_URL;
}
