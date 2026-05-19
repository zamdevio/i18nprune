// src/types/index.ts
import { KeyObservation, ReviewLocaleStats } from './core';

export * from './core';

export interface ProjectHealth {
  totalSourceKeys: number;
  locales: string[];
  observations: KeyObservation[];
  stats: ReviewLocaleStats[];
}

export interface PruneResult {
  success: boolean;
  keysRemoved: number;
}

export interface DoctorCheck {
  id: string;
  label: string;
  value: string;
  status: 'pass' | 'warn' | 'fail';
}

export interface Tab {
  id: string;
  type: 'view' | 'file';
  label: string;
  data?: any;
}

/** Serialized dashboard UI for panel → editor handoff (`openDashboardInEditor`). */
export const DASHBOARD_SNAPSHOT_VERSION = 1 as const;

export type DashboardSnapshotV1 = {
  v: typeof DASHBOARD_SNAPSHOT_VERSION;
  tabs: Tab[];
  activeTabId: string;
  sidebarSection: 'navigation' | 'files';
  explorerCollapsed: boolean;
  isSidebarVisible: boolean;
  isDarkMode: boolean;
  selectedKey: KeyObservation | null;
};
