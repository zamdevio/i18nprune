import type { CommitType } from '../types';

export const COMMIT_TYPES: CommitType[] = [
  'feat',
  'chore',
  'docs',
  'refactor',
  'fix',
  'test',
  'ci',
];

export function parseTypeParam(raw: string | null): CommitType | 'all' {
  if (!raw) return 'all';
  return COMMIT_TYPES.includes(raw as CommitType) ? (raw as CommitType) : 'all';
}

export function parseScopeParam(raw: string | null, validScopes: readonly string[]): string {
  if (!raw) return 'all';
  return validScopes.includes(raw) ? raw : 'all';
}

export function isValidTypeParam(raw: string | null): boolean {
  if (!raw) return true;
  return COMMIT_TYPES.includes(raw as CommitType);
}

export function isValidScopeParam(raw: string | null, validScopes: readonly string[]): boolean {
  if (!raw) return true;
  return validScopes.includes(raw);
}

export function parseBranchParam(raw: string | null, validBranches: readonly string[]): string {
  if (!raw) return 'all';
  return validBranches.includes(raw) ? raw : 'all';
}

export function isValidBranchParam(raw: string | null, validBranches: readonly string[]): boolean {
  if (!raw) return true;
  return validBranches.includes(raw);
}
