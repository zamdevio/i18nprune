import {
  DASHBOARD_SNAPSHOT_VERSION,
  type DashboardSnapshotV1,
  type KeyObservation,
} from '../types';

function isKeyObservation(raw: unknown): raw is KeyObservation {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (kind === 'literal' || kind === 'template_resolved') {
    return typeof o.resolvedKey === 'string' && typeof o.span === 'object' && o.span !== null;
  }
  if (kind === 'template_partial') {
    return (
      typeof o.templateRaw === 'string' &&
      Array.isArray(o.unresolvedPlaceholders) &&
      typeof o.span === 'object' &&
      o.span !== null
    );
  }
  return false;
}

/** Validates extension-forwarded JSON before applying to React state. */
export function parseDashboardSnapshot(raw: unknown): DashboardSnapshotV1 | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== DASHBOARD_SNAPSHOT_VERSION) return null;
  if (!Array.isArray(o.tabs)) return null;
  for (const t of o.tabs) {
    if (!t || typeof t !== 'object') return null;
    const tab = t as Record<string, unknown>;
    if (typeof tab.id !== 'string') return null;
    if (tab.type !== 'view' && tab.type !== 'file') return null;
    if (typeof tab.label !== 'string') return null;
  }
  if (typeof o.activeTabId !== 'string') return null;
  if (o.sidebarSection !== 'navigation' && o.sidebarSection !== 'files') return null;
  if (typeof o.explorerCollapsed !== 'boolean') return null;
  if (typeof o.isSidebarVisible !== 'boolean') return null;
  if (typeof o.isDarkMode !== 'boolean') return null;
  let selectedKey: KeyObservation | null = null;
  if (o.selectedKey !== undefined && o.selectedKey !== null) {
    if (!isKeyObservation(o.selectedKey)) return null;
    selectedKey = o.selectedKey;
  }

  return {
    v: DASHBOARD_SNAPSHOT_VERSION,
    tabs: o.tabs as DashboardSnapshotV1['tabs'],
    activeTabId: o.activeTabId,
    sidebarSection: o.sidebarSection,
    explorerCollapsed: o.explorerCollapsed,
    isSidebarVisible: o.isSidebarVisible,
    isDarkMode: o.isDarkMode,
    selectedKey,
  };
}
