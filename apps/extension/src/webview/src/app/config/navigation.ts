import {
  BarChart3,
  ShieldCheck,
  Settings as SettingsIcon,
  Globe,
  Cpu,
  Trash2,
  Languages,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItemId =
  | 'dashboard'
  | 'validation'
  | 'sync'
  | 'cleanup'
  | 'generate'
  | 'multi-editor'
  | 'doctor'
  | 'config'
  | 'settings';

export type NavItem = {
  id: NavItemId;
  label: string;
  icon: LucideIcon;
  category: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Monitor', icon: BarChart3, category: 'View' },
  { id: 'validation', label: 'Diagnostics', icon: ShieldCheck, category: 'View' },
  { id: 'sync', label: 'Review & Sync', icon: Globe, category: 'View' },
  { id: 'cleanup', label: 'Cleanup', icon: Trash2, category: 'View' },
  { id: 'generate', label: 'Generate', icon: Sparkles, category: 'View' },
  { id: 'multi-editor', label: 'Sync Editor', icon: Languages, category: 'View' },
  { id: 'doctor', label: 'Environment', icon: Cpu, category: 'View' },
  { id: 'config', label: 'Project config', icon: LayoutTemplate, category: 'Action' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, category: 'Action' },
];

