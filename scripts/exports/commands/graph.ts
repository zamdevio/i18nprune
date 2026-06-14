import type { GraphEdge, InventoryNamespace, InventorySnapshot } from '../inventory/index.js';
import { getSnapshot } from '../cache/index.js';
import { resolveSourceRef } from '../git/index.js';
import { printCommandLine, printGraphReport } from '../logger/index.js';

export interface GraphCliOptions {
  ref?: string;
  noCache?: boolean;
  force?: boolean;
  verbose?: boolean;
}

interface TargetSubpathGroup {
  targetSubpath: string;
  flat: number;
  namespace: number;
  modules: Map<string, number>;
}

interface ModuleGroup {
  module: string;
  edges: number;
  symbols: string[];
}

function groupByTargetSubpath(snapshot: InventorySnapshot): TargetSubpathGroup[] {
  const map = new Map<string, TargetSubpathGroup>();

  const touch = (targetSubpath: string): TargetSubpathGroup => {
    let group = map.get(targetSubpath);
    if (!group) {
      group = { targetSubpath, flat: 0, namespace: 0, modules: new Map() };
      map.set(targetSubpath, group);
    }
    return group;
  };

  for (const edge of snapshot.edges) {
    const group = touch(edge.targetSubpath);
    if (edge.kind === 'namespace-reexport') group.namespace += 1;
    else group.flat += 1;
    group.modules.set(edge.toModule, (group.modules.get(edge.toModule) ?? 0) + 1);
  }

  return [...map.values()].sort((a, b) => b.flat + b.namespace - (a.flat + a.namespace));
}

function topModules(edges: GraphEdge[], limit = 10): ModuleGroup[] {
  const map = new Map<string, { edges: number; symbols: string[] }>();
  for (const edge of edges) {
    const prev = map.get(edge.toModule) ?? { edges: 0, symbols: [] };
    prev.edges += 1;
    if (prev.symbols.length < 5) prev.symbols.push(edge.symbol);
    map.set(edge.toModule, prev);
  }
  return [...map.entries()]
    .map(([module, data]) => ({ module, ...data }))
    .sort((a, b) => b.edges - a.edges)
    .slice(0, limit);
}

function namespaceRows(namespaces: InventoryNamespace[]): { name: string; targetSubpath: string; module: string | null }[] {
  return namespaces
    .map((ns) => ({ name: ns.name, targetSubpath: ns.targetSubpath, module: ns.sourceModule }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function runExportsGraph(options: GraphCliOptions = {}): void {
  const t0 = performance.now();
  const ref = resolveSourceRef(options.ref);
  const { snapshot, cache } = getSnapshot(ref, {
    noCache: options.noCache,
    force: options.force,
    profile: 'full',
  });

  printCommandLine('graph', 'ok', Math.round(performance.now() - t0));
  printGraphReport({
    ref,
    snapshot,
    cache,
    targetGroups: groupByTargetSubpath(snapshot),
    topModules: topModules(snapshot.edges, options.verbose ? 20 : 8),
    namespaces: namespaceRows(snapshot.namespaces),
    verbose: options.verbose,
  });
}
