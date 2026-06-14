import { resolveModuleCandidates } from './source.js';
import type { ResolvedSymbolKind } from './types.js';

const DEFINITION_PATTERNS: { kind: ResolvedSymbolKind; pattern: (name: string) => RegExp }[] = [
  { kind: 'function', pattern: (n) => new RegExp(`export\\s+(?:async\\s+)?function\\s+${escapeRegExp(n)}\\b`) },
  { kind: 'const', pattern: (n) => new RegExp(`export\\s+const\\s+${escapeRegExp(n)}\\b`) },
  { kind: 'class', pattern: (n) => new RegExp(`export\\s+(?:abstract\\s+)?class\\s+${escapeRegExp(n)}\\b`) },
  { kind: 'enum', pattern: (n) => new RegExp(`export\\s+enum\\s+${escapeRegExp(n)}\\b`) },
  { kind: 'interface', pattern: (n) => new RegExp(`export\\s+interface\\s+${escapeRegExp(n)}\\b`) },
  { kind: 'type-alias', pattern: (n) => new RegExp(`export\\s+type\\s+${escapeRegExp(n)}\\b`) },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function kindFromSource(content: string, symbolName: string): ResolvedSymbolKind | null {
  for (const { kind, pattern } of DEFINITION_PATTERNS) {
    if (pattern(symbolName).test(content)) return kind;
  }
  return null;
}

/** Best-effort symbol kind: direct definition, then one re-export hop. */
export function resolveSymbolKind(
  symbolName: string,
  tsKind: 'value' | 'type',
  moduleContent: string | null,
  readModule: (repoPath: string) => string | null,
  moduleRepoPath: string | null,
): ResolvedSymbolKind {
  if (tsKind === 'type') {
    if (!moduleContent) return 'type-alias';
    return kindFromSource(moduleContent, symbolName) ?? 'type-alias';
  }

  if (!moduleContent || !moduleRepoPath) return 'unknown';

  const direct = kindFromSource(moduleContent, symbolName);
  if (direct) return direct;

  const reExport = new RegExp(
    `export\\s*\\{[^}]*\\b${escapeRegExp(symbolName)}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`,
  ).exec(moduleContent);

  if (reExport) {
    const barrelPath = moduleRepoPath;
    for (const candidate of resolveModuleCandidates(barrelPath, reExport[1]!)) {
      const nested = readModule(candidate);
      if (!nested) continue;
      const nestedKind = kindFromSource(nested, symbolName);
      if (nestedKind) return nestedKind;
    }
  }

  if (/^ISSUE_/.test(symbolName)) return 'const';
  if (/^run[A-Z]/.test(symbolName)) return 'function';

  return 'unknown';
}
