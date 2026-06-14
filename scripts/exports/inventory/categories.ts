import type { ExportCategory } from './types.js';
import { classifySymbolTier, type StabilityTier } from './tiers.js';

const RUN_ENTRY = /^run[A-Z]/;
const CONTEXT = /^create[A-Z].*Context$/;

export function classifyExportCategory(name: string, tsKind: 'value' | 'type', exportKind: 'flat' | 'namespace'): ExportCategory {
  if (exportKind === 'namespace') return 'namespace-mirror';
  if (tsKind === 'type') return 'type';
  if (name.startsWith('ISSUE_')) return 'issues';
  if (RUN_ENTRY.test(name)) return 'run';
  if (name === 'defineConfig' || name === 'loadConfig' || name.startsWith('resolveConfig')) return 'config';
  if (CONTEXT.test(name)) return 'context';

  const tier = classifySymbolTier(name);
  if (tier === 'advanced') return 'advanced';
  if (tier === 'internal') return 'internal';

  return 'other';
}

/** Intended npm subpath after EX-1…EX-3 (governance map). */
export function targetSubpathFor(category: ExportCategory, name: string): string {
  switch (category) {
    case 'issues':
      return './issues';
    case 'advanced':
      return './advanced';
    case 'internal':
      return './internal';
    case 'run':
    case 'context':
      return '.';
    case 'config':
      return './config';
    case 'namespace-mirror': {
      const domain = name;
      const known = [
        'validate',
        'sync',
        'generate',
        'init',
        'locales',
        'missing',
        'cleanup',
        'quality',
        'config',
        'runtime',
      ];
      if (known.includes(domain)) return `./${domain === 'locales' ? 'locales' : domain}`;
      return '.';
    }
    case 'type':
      return './types';
    case 'shared':
      return './shared';
    default:
      return '.';
  }
}

export function tierForNamespace(): StabilityTier {
  return 'stable';
}
