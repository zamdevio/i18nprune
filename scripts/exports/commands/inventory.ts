import { getSnapshot } from '../cache/index.js';
import { formatGitRunStats, resetGitRunStats, resolveSourceRef } from '../git/index.js';
import { printCommandLine, printInventoryReport, printVerboseInventory } from '../logger/index.js';

export interface InventoryCliOptions {
  ref?: string;
  verbose?: boolean;
  noCache?: boolean;
  force?: boolean;
}

export function runExportsInventory(options: InventoryCliOptions): void {
  resetGitRunStats();
  const t0 = performance.now();
  const ref = resolveSourceRef(options.ref);
  const result = getSnapshot(ref, { noCache: options.noCache, force: options.force, profile: 'full' });
  printCommandLine('inventory', 'ok', Math.round(performance.now() - t0));
  printInventoryReport({
    ref,
    result,
    gitStats: options.verbose ? formatGitRunStats() : undefined,
  });
  if (options.verbose) printVerboseInventory(result.snapshot);
}
