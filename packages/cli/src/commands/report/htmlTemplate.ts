import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReportHtml } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { existsRuntimeFsSync } from '@i18nprune/core/runtime/helpers/sync';
import type { ProjectReportDocument } from '@/types/command/report/index.js';

/**
 * Loads the Vite-built single-file report UI from **`dist/report/index.html`** and injects the
 * JSON payload into a `<script type="application/json">` block.
 */
export function renderProjectReportSpaHtml(doc: ProjectReportDocument): string {
  const fs = createNodeRuntimeAdapters().fs;
  const templatePath = resolveCliReportSpaTemplatePath(fs);
  return renderReportHtml(doc, { fs, templatePath });
}

function resolveCliReportSpaTemplatePath(fs: ReturnType<typeof createNodeRuntimeAdapters>['fs']): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packaged = path.join(here, 'report', 'index.html');
  if (existsRuntimeFsSync(packaged, fs)) {
    return packaged;
  }
  const fromSource = path.resolve(here, '../../..', 'dist', 'report', 'index.html');
  if (existsRuntimeFsSync(fromSource, fs)) {
    return fromSource;
  }
  throw new Error(
    [
      `Report UI bundle not found (looked for ${packaged} and ${fromSource}).`,
      'The HTML shell is produced by Vite in `apps/report` and must be present when generating HTML reports.',
      'From the repo root: `pnpm run cli:build` (or `pnpm run report:build` then run `node scripts/report/build-assets.mjs`).',
      'Published npm installs include `dist/report/index.html` next to `dist/cli.js` after a full release build.',
    ].join(' '),
  );
}
