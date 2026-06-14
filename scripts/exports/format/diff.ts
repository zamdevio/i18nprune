import type { InventorySnapshot } from '../inventory/index.js';

export interface DiffResult {
  added: string[];
  removed: string[];
  summaryDelta: {
    left: InventorySnapshot['summary'];
    right: InventorySnapshot['summary'];
  };
  tierViolations: string[];
}

export function diffSnapshots(left: InventorySnapshot, right: InventorySnapshot): DiffResult {
  const leftNames = new Set(left.symbols.filter((s) => s.exportKind === 'flat').map((s) => s.name));
  const rightNames = new Set(right.symbols.filter((s) => s.exportKind === 'flat').map((s) => s.name));

  const added = [...rightNames].filter((n) => !leftNames.has(n)).sort();
  const removed = [...leftNames].filter((n) => !rightNames.has(n)).sort();

  const tierViolations: string[] = [];
  for (const sym of right.symbols) {
    if (sym.exportKind !== 'flat') continue;
    if (sym.tier === 'internal') {
      tierViolations.push(`${sym.name} (${sym.tier}) exported flat on root`);
    }
    if (sym.tier === 'unclassified') {
      tierViolations.push(`${sym.name} (unclassified)`);
    }
  }

  return {
    added,
    removed,
    summaryDelta: { left: left.summary, right: right.summary },
    tierViolations,
  };
}
