import { classifyExportCategory, targetSubpathFor, tierForNamespace } from './categories.js';
import { fingerprintSource } from './fingerprint.js';
import { parseBarrelExports, type ParsedExport } from './parse-barrel.js';
import { resolveSymbolKind } from './resolve-symbol.js';
import {
  publishedSubpathBarrels,
  readModule,
  readModuleAtPath,
  type SourceReader,
} from './source.js';
import { classifySymbolTier } from './tiers.js';
import { TOOL_VERSION, rootIndexRepoPath } from '../paths.js';
import { gitCommitMeta } from '../git/commit-meta.js';
import type {
  GraphEdge,
  InventoryNamespace,
  InventorySnapshot,
  InventorySummary,
  InventorySymbol,
  RootSummary,
  SubpathRollup,
  TierCounts,
} from './types.js';

function emptyTierCounts(): TierCounts {
  return { stable: 0, advanced: 0, internal: 0, unclassified: 0 };
}

function rollTier(counts: TierCounts, tier: InventorySymbol['tier']): void {
  counts[tier] += 1;
}

function buildRootSummary(symbols: InventorySymbol[], namespaces: InventoryNamespace[]): RootSummary {
  const summary: RootSummary = {
    flat: symbols.length,
    namespace: namespaces.length,
    ...emptyTierCounts(),
    byTsKind: { value: 0, type: 0 },
    bySymbolKind: {},
    byCategory: {},
  };

  for (const sym of symbols) {
    rollTier(summary, sym.tier);
    summary.byTsKind[sym.tsKind] += 1;
    summary.bySymbolKind[sym.symbolKind] = (summary.bySymbolKind[sym.symbolKind] ?? 0) + 1;
    summary.byCategory[sym.category] = (summary.byCategory[sym.category] ?? 0) + 1;
  }

  return summary;
}

function enrichBarrel(input: {
  barrelRepoPath: string;
  fromSubpath: string;
  source: string;
  reader: SourceReader;
}): {
  symbols: InventorySymbol[];
  namespaces: InventoryNamespace[];
  edges: GraphEdge[];
} {
  const parsed = parseBarrelExports(input.source, input.barrelRepoPath);
  const symbols: InventorySymbol[] = [];
  const namespaces: InventoryNamespace[] = [];
  const edges: GraphEdge[] = [];
  const moduleCache = new Map<string, string | null>();

  const readCached = (repoPath: string): string | null => {
    if (moduleCache.has(repoPath)) return moduleCache.get(repoPath)!;
    const content = readModuleAtPath(input.reader, repoPath);
    moduleCache.set(repoPath, content);
    return content;
  };

  for (const item of parsed) {
    const mod = item.sourceSpecifier
      ? readModule(input.reader, input.barrelRepoPath, item.sourceSpecifier)
      : null;
    const moduleRepoPath = mod?.repoPath ?? null;
    const moduleContent = mod?.content ?? null;

    if (item.exportKind === 'namespace') {
      const category = classifyExportCategory(item.name, 'value', 'namespace');
      const targetSubpath = targetSubpathFor(category, item.name);
      namespaces.push({
        name: item.name,
        tier: tierForNamespace(),
        category,
        targetSubpath,
        sourceModule: moduleRepoPath,
      });
      if (moduleRepoPath) {
        edges.push({
          kind: 'namespace-reexport',
          from: input.fromSubpath,
          symbol: item.name,
          toModule: moduleRepoPath,
          targetSubpath,
        });
      }
      continue;
    }

    const tier = classifySymbolTier(item.name);
    const category = classifyExportCategory(item.name, item.tsKind, 'flat');
    const targetSubpath = targetSubpathFor(category, item.name);
    const symbolKind = resolveSymbolKind(
      item.name,
      item.tsKind,
      moduleContent,
      readCached,
      moduleRepoPath,
    );

    symbols.push({
      name: item.name,
      tsKind: item.tsKind,
      exportKind: 'flat',
      tier,
      category,
      targetSubpath,
      symbolKind,
      sourceModule: moduleRepoPath,
      subpath: '.',
    });

    if (moduleRepoPath) {
      edges.push({
        kind: 'flat-reexport',
        from: input.fromSubpath,
        symbol: item.name,
        toModule: moduleRepoPath,
        targetSubpath,
      });
    }
  }

  return { symbols, namespaces, edges };
}

function buildSubpathRollups(reader: SourceReader): SubpathRollup[] {
  const rollups: SubpathRollup[] = [];

  for (const { npmSubpath, repoPath } of publishedSubpathBarrels()) {
    if (npmSubpath === '@i18nprune/core') continue;
    const source = readModuleAtPath(reader, repoPath);
    if (!source) continue;

    const parsed = parseBarrelExports(source, repoPath);
    const byTier = emptyTierCounts();
    for (const item of parsed) {
      if (item.exportKind !== 'flat') continue;
      rollTier(byTier, classifySymbolTier(item.name));
    }

    const counts = {
      flat: parsed.filter((p) => p.exportKind === 'flat').length,
      namespace: parsed.filter((p) => p.exportKind === 'namespace').length,
    };

    rollups.push({
      npmSubpath,
      sourceEntry: repoPath,
      ...counts,
      byTier,
    });
  }

  return rollups.sort((a, b) => a.npmSubpath.localeCompare(b.npmSubpath));
}

function buildLightRootSummary(parsed: ParsedExport[]): RootSummary {
  const summary: RootSummary = {
    flat: 0,
    namespace: 0,
    ...emptyTierCounts(),
    byTsKind: { value: 0, type: 0 },
    bySymbolKind: {},
    byCategory: {},
  };

  for (const item of parsed) {
    if (item.exportKind === 'namespace') {
      summary.namespace += 1;
      continue;
    }
    summary.flat += 1;
    const tier = classifySymbolTier(item.name);
    rollTier(summary, tier);
    summary.byTsKind[item.tsKind] += 1;
    const category = classifyExportCategory(item.name, item.tsKind, 'flat');
    summary.byCategory[category] = (summary.byCategory[category] ?? 0) + 1;
  }

  return summary;
}

/** Fast path for timeline: root barrel parse only (no module reads, no symbol resolution). */
export function buildLightSnapshot(input: {
  sha: string;
  refLabel: string;
  source: string;
  /** When omitted, resolved via git (skip when caller already has commit date). */
  git?: InventorySnapshot['git'];
}): InventorySnapshot {
  const parsed = parseBarrelExports(input.source, rootIndexRepoPath);
  const git = input.git ?? gitCommitMeta(input.sha) ?? undefined;

  return {
    version: 1,
    toolVersion: TOOL_VERSION,
    sha: input.sha,
    refLabel: input.refLabel,
    generatedAt: new Date().toISOString(),
    sourceFingerprint: fingerprintSource(input.source),
    scanDepth: 'light',
    git: git ?? undefined,
    barrel: rootIndexRepoPath,
    summary: { root: buildLightRootSummary(parsed), subpaths: [] },
    symbols: [],
    namespaces: [],
    edges: [],
  };
}

export function buildSnapshot(input: {
  sha: string;
  refLabel: string;
  source: string;
  reader: SourceReader;
}): InventorySnapshot {
  const root = enrichBarrel({
    barrelRepoPath: rootIndexRepoPath,
    fromSubpath: '.',
    source: input.source,
    reader: input.reader,
  });

  const subpaths = buildSubpathRollups(input.reader);
  const summary: InventorySummary = {
    root: buildRootSummary(root.symbols, root.namespaces),
    subpaths,
  };

  const git = gitCommitMeta(input.sha);

  return {
    version: 1,
    toolVersion: TOOL_VERSION,
    sha: input.sha,
    refLabel: input.refLabel,
    generatedAt: new Date().toISOString(),
    sourceFingerprint: fingerprintSource(input.source),
    scanDepth: 'full',
    git: git ?? undefined,
    barrel: rootIndexRepoPath,
    summary,
    symbols: root.symbols,
    namespaces: root.namespaces,
    edges: root.edges,
  };
}

export function summarizeInventory(snapshot: Pick<InventorySnapshot, 'summary'>): InventorySummary {
  return snapshot.summary;
}
