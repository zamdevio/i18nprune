import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { select } from '@inquirer/prompts';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { getRunOptions } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { duringPrompt } from '@/utils/timer/index.js';

const nodeFs = createNodeRuntimeAdapters().fs;

function keepBothPath(target: string): string {
  const dir = path.dirname(target);
  const ext = path.extname(target);
  const stem = path.basename(target, ext);
  let candidate = path.join(dir, `${stem}-${randomBytes(4).toString('hex')}${ext}`);
  while (existsRuntimeFsSync(candidate, nodeFs)) {
    candidate = path.join(dir, `${stem}-${randomBytes(4).toString('hex')}${ext}`);
  }
  return candidate;
}

export async function resolveReportOutputPath(target: string): Promise<string | null> {
  if (!existsRuntimeFsSync(target, nodeFs)) return target;
  /** Non-interactive / automation: never prompt (TTY or not). `--json` must not block on overwrite. */
  if (getCliYesFlag() || shouldSkipInteractivePrompts() || getRunOptions().json) {
    return keepBothPath(target);
  }
  const action = await duringPrompt(() =>
    select({
      message: `Report file exists: ${target}`,
      choices: [
        { name: 'Overwrite existing file', value: 'overwrite' },
        { name: 'Keep both (write new file with random 8-char hex suffix)', value: 'keep-both' },
        { name: 'Skip report file writing', value: 'skip' },
      ],
      default: 'keep-both',
    }),
  );
  if (action === 'skip') return null;
  if (action === 'keep-both') return keepBothPath(target);
  return target;
}
