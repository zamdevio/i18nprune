import type { RunOptions } from '@/types/core/runtime/index.js';
import type { CommandSummary } from '@/types/cli/output/index.js';

export type OutputHookContext = {
  run: RunOptions;
  summary: CommandSummary;
};

/**
 * Optional command-specific hooks (e.g. progress/TTY-specific integrations).
 * Core policy remains centralized in output orchestration.
 */
export type CommandOutputHooks = {
  beforeSummary?: (ctx: OutputHookContext) => void;
  afterSummary?: (ctx: OutputHookContext) => void;
};
