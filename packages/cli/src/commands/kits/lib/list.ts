import type { I18nPruneConfig } from '@i18nprune/core/config';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';

export function resolveKitsListWindow(config: I18nPruneConfig) {
  const window = resolveCliListWindow(config);
  return window.full ? { full: true as const } : { top: window.top ?? 3, full: false as const };
}

export function listModeLabel(full: boolean, top?: number): string {
  return full ? 'full' : `top ${top ?? 3}`;
}
