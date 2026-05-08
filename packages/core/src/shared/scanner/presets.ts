import type { ScanExcludeConfig } from '../../types/scanner/exclude.js';

/**
 * Built-in exclusion presets. Keep intentionally small and predictable; callers can still append
 * custom rules via `exclude.dirs/files/extensions/patterns`.
 */
export const SCAN_EXCLUDE_PRESETS: Record<NonNullable<ScanExcludeConfig['preset']>, Omit<ScanExcludeConfig, 'preset'>> = {
  production: {
    dirs: ['node_modules', 'dist', 'build', 'compiled', 'tests', 'bench'],
    files: ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'],
    extensions: ['test.ts', 'test.tsx', 'spec.ts', 'spec.tsx', 'test.js', 'test.jsx', 'spec.js', 'spec.jsx'],
  },
};

/**
 * Merge preset-derived rules (`extra`) with explicit config (`base` minus `preset`).
 * For each list field, **preset values come first**, then config file values (so config can extend, not replace, preset lists).
 * `useDefaultSkip` uses config when set, otherwise preset.
 */
function mergeExcludeRules(base?: ScanExcludeConfig, extra?: Omit<ScanExcludeConfig, 'preset'>): ScanExcludeConfig | undefined {
  if (!base && !extra) return undefined;
  return {
    useDefaultSkip: base?.useDefaultSkip ?? extra?.useDefaultSkip,
    dirs: [...(extra?.dirs ?? []), ...(base?.dirs ?? [])],
    files: [...(extra?.files ?? []), ...(base?.files ?? [])],
    extensions: [...(extra?.extensions ?? []), ...(base?.extensions ?? [])],
    patterns: [...(extra?.patterns ?? []), ...(base?.patterns ?? [])],
  };
}

/**
 * Expand `exclude.preset` into concrete rules, then merge explicit `dirs` / `files` / `extensions` / `patterns`.
 * **CLI** (`--exclude` dirs) is applied in the CLI layer **after** the config file is loaded,
 * so it wins for those fields over file-only values (see docs `config/exclude`).
 */
export function resolveScanExcludeConfig(exclude?: ScanExcludeConfig): ScanExcludeConfig | undefined {
  if (!exclude) return undefined;
  const fromPreset = exclude.preset ? SCAN_EXCLUDE_PRESETS[exclude.preset] : undefined;
  return mergeExcludeRules(exclude, fromPreset);
}
