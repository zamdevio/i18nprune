import type { ScanProjectSourceFilesInput } from './shared/index.js';

/**
 * Shared filesystem + override fields for project-wide scans (key sites, dynamic sites, literal usage).
 * Keeps orchestration `Pick<>` types aligned.
 */
export type ScanProjectFilesystemInputBase = Pick<
  ScanProjectSourceFilesInput<unknown>,
  'srcRoot' | 'cwd' | 'runtime' | 'path' | 'readFile' | 'listFiles' | 'exclude'
>;
