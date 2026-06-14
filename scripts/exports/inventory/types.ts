import { SNAPSHOT_VERSION, TOOL_VERSION } from '../paths.js';
import type { StabilityTier } from './tiers.js';

export type { StabilityTier } from './tiers.js';

export type TsExportKind = 'value' | 'type';

export type ExportKind = 'flat' | 'namespace';

/** Resolved definition kind after reading source modules (best effort). */
export type ResolvedSymbolKind =
  | 'function'
  | 'const'
  | 'class'
  | 'enum'
  | 'interface'
  | 'type-alias'
  | 'namespace'
  | 'unknown';

/** Governance category (target subpath grouping — not semver tier). */
export type ExportCategory =
  | 'issues'
  | 'run'
  | 'config'
  | 'context'
  | 'advanced'
  | 'internal'
  | 'namespace-mirror'
  | 'type'
  | 'shared'
  | 'other';

export interface TierCounts {
  stable: number;
  advanced: number;
  internal: number;
  unclassified: number;
}

export interface InventorySymbol {
  name: string;
  tsKind: TsExportKind;
  exportKind: ExportKind;
  tier: StabilityTier;
  category: ExportCategory;
  targetSubpath: string;
  symbolKind: ResolvedSymbolKind;
  /** Repo-relative path e.g. packages/core/src/... */
  sourceModule: string | null;
  subpath: '.';
}

export interface InventoryNamespace {
  name: string;
  tier: StabilityTier;
  category: ExportCategory;
  targetSubpath: string;
  sourceModule: string | null;
}

export interface GraphEdge {
  kind: 'flat-reexport' | 'namespace-reexport' | 'namespace-mirror';
  from: string;
  symbol: string;
  toModule: string;
  targetSubpath: string;
}

export interface SubpathRollup {
  npmSubpath: string;
  sourceEntry: string;
  flat: number;
  namespace: number;
  byTier: TierCounts;
}

export interface RootSummary extends TierCounts {
  flat: number;
  namespace: number;
  byTsKind: { value: number; type: number };
  bySymbolKind: Partial<Record<ResolvedSymbolKind, number>>;
  byCategory: Partial<Record<ExportCategory, number>>;
}

export interface InventorySummary {
  root: RootSummary;
  subpaths: SubpathRollup[];
}

export interface SnapshotGitMeta {
  commitDate: string;
  authorDate?: string;
}

export type SnapshotScanDepth = 'full' | 'light';

export interface InventorySnapshot {
  version: typeof SNAPSHOT_VERSION;
  toolVersion: typeof TOOL_VERSION;
  sha: string;
  refLabel: string;
  generatedAt: string;
  /** Hash of root barrel source at generation time (cache freshness for working tree). */
  sourceFingerprint?: string;
  scanDepth?: SnapshotScanDepth;
  git?: SnapshotGitMeta;
  barrel: string;
  summary: InventorySummary;
  symbols: InventorySymbol[];
  namespaces: InventoryNamespace[];
  edges: GraphEdge[];
}
