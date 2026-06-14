export {
  buildLightSnapshot,
  buildSnapshot,
  summarizeInventory,
} from './build.js';
export { parseBarrelExports } from './parse-barrel.js';
export { classifyExportCategory, targetSubpathFor } from './categories.js';
export { classifySymbolTier } from './tiers.js';
export type {
  ExportCategory,
  ExportKind,
  GraphEdge,
  InventoryNamespace,
  InventorySnapshot,
  InventorySummary,
  InventorySymbol,
  ResolvedSymbolKind,
  RootSummary,
  SnapshotScanDepth,
  StabilityTier,
  SubpathRollup,
  TsExportKind,
} from './types.js';
