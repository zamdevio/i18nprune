import { DEFAULT_LIST_TOP, resolveCoreConfigLayers } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import { getCliListFullFlag, getCliListTopFlag } from '@/shared/context/globals.js';

export type CommandListWindowInput = {
  top?: number;
  full?: boolean;
  /** Command-specific UX default when neither config nor args set a top. */
  defaultTop?: number;
  /** Command-specific UX default when neither config nor args set top/full. */
  defaultFull?: boolean;
};

/**
 * CLI adapter: map command args + resolved file config into a core list-window resolution.
 * Core owns clamp/default semantics; CLI just provides layers.
 */
export function resolveCliListWindow(config: I18nPruneConfig, command?: CommandListWindowInput) {
  const globalTop = getCliListTopFlag();
  const globalFull = getCliListFullFlag();
  const top =
    command?.top !== undefined
      ? command.top
      : globalTop !== undefined
        ? globalTop
      : (command?.defaultTop ?? DEFAULT_LIST_TOP);
  const useDefaultFull =
    command?.defaultFull === true &&
    command?.full !== true &&
    !globalFull &&
    command?.top === undefined &&
    globalTop === undefined;
  const full = command?.full === true || globalFull || useDefaultFull;
  return resolveCoreConfigLayers([
    { name: 'file', input: { output: { list: config.output?.list } } },
    {
      name: 'command',
      input: {
        output: {
          list: {
            ...(top !== undefined ? { top } : {}),
            ...(full ? { full: true } : {}),
          },
        },
      },
    },
  ]).output.list;
}
