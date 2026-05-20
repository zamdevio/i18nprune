import { confirm, select } from '@inquirer/prompts';
import { duringPrompt } from '@/utils/timer/index.js';
import type { ShareCacheEntry } from '@i18nprune/core';

/** Interactive pick: project zip vs stored report JSON. */
export async function promptShareKind(): Promise<'project' | 'report'> {
  return duringPrompt(() =>
    select<'project' | 'report'>({
      message: 'What do you want to share?',
      choices: [
        {
          name: 'Project — zip of src + locales for the web workspace (web.i18nprune.dev)',
          value: 'project',
        },
        {
          name: 'Report — JSON report for a hosted share link (report.i18nprune.dev)',
          value: 'report',
        },
      ],
    }),
  );
}

/** Confirm before uploading to the worker (wall time paused during prompt). */
export async function confirmShareUpload(input: { message: string; defaultValue?: boolean }): Promise<boolean> {
  return duringPrompt(() =>
    confirm({
      message: input.message,
      default: input.defaultValue ?? true,
    }),
  );
}

/** Pick one row from local share cache metadata. */
/** Confirm bulk delete of every `share.json` row. */
export async function confirmShareDeleteAll(count: number): Promise<boolean> {
  return duringPrompt(() =>
    confirm({
      message: `Delete all ${String(count)} cached upload(s) from share.json and the worker?`,
      default: false,
    }),
  );
}

export async function promptSharePickEntry(entries: readonly ShareCacheEntry[], message: string): Promise<ShareCacheEntry> {
  return duringPrompt(() =>
    select<ShareCacheEntry>({
      message,
      choices: entries.map((e) => {
        const id = e.kind === 'project' ? e.workerProjectId : e.workerReportId;
        const label = e.kind === 'project' ? 'project' : 'report';
        return {
          name: `${label} ${id ?? '?'} @ ${e.workerBaseUrl}`,
          value: e,
        };
      }),
    }),
  );
}
