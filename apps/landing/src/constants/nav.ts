/**
 * Primary in-page destinations — same ids, order, and labels everywhere
 * (header pill nav, “On this page” rail, ⌘K palette).
 *
 * Only sections that exist in the DOM with matching `id` should appear here.
 * Deeper sections (Doctor, Terminal, Scanner, CI, …) stay in-page only.
 */
export interface PrimaryNavItem {
  id: string;
  label: string;
  /** Optional shorter label for the right rail */
  railLabel?: string;
}

/**
 * Order MUST match `<main>` section order in `App.tsx` so scroll-spy and
 * “last passed section” logic stay correct.
 */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'architecture', label: 'Architecture', railLabel: 'Blueprint' },
  { id: 'features', label: 'Features', railLabel: 'Features' },
  { id: 'commands', label: 'Commands', railLabel: 'Commands' },
  { id: 'install', label: 'Install', railLabel: 'Install' },
  { id: 'runtime', label: 'Runtime', railLabel: 'Runtimes' },
  { id: 'open-source', label: 'Open source', railLabel: 'Open source' },
  { id: 'built-by', label: 'Built by', railLabel: 'Built by' },
];

export const PRIMARY_NAV_IDS: readonly string[] = PRIMARY_NAV.map((n) => n.id);

export const RAIL_INTRO = { id: 'top', label: 'Intro' } as const;

export function navHref(id: string) {
  return `#${id}`;
}
