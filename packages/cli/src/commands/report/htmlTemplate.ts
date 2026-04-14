import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProjectReportDocument } from '@/types/command/report/index.js';

/**
 * Loads the Vite-built single-file report UI from **`dist/report/index.html`** and injects the
 * JSON payload into a `<script type="application/json">` block.
 *
 * **Important:** Injection must replace **only** the payload script body. A global replace of the
 * HTML placeholder token (`__I18NPRUNE_REPORT__` in `apps/report/index.html`) would corrupt the
 * bundled JS, which embeds the same string literal for runtime checks.
 */
export function renderProjectReportSpaHtml(doc: ProjectReportDocument): string {
  const templatePath = resolveReportSpaTemplatePath();
  const tpl = fs.readFileSync(templatePath, 'utf8');
  const safeJson = JSON.stringify(doc)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return injectJsonIntoPayloadScript(tpl, safeJson, templatePath);
}

/** Replaces inner HTML of `#i18nprune-inline-payload` only (see `apps/report/index.html`). */
export function injectJsonIntoPayloadScript(
  tpl: string,
  safeJson: string,
  templatePathForError: string,
): string {
  const patterns: RegExp[] = [
    /<script\s+id="i18nprune-inline-payload"\s+type="application\/json"\s*>[\s\S]*?<\/script>/i,
    /<script\s+type="application\/json"\s+id="i18nprune-inline-payload"\s*>[\s\S]*?<\/script>/i,
  ];
  for (const re of patterns) {
    const m = tpl.match(re);
    if (!m) continue;
    const full = m[0];
    const open = full.match(/^<script[^>]*>/)?.[0];
    if (!open) continue;
    return tpl.replace(full, `${open}${safeJson}</script>`);
  }
  throw new Error(
    [
      `Report UI template at ${templatePathForError} is missing the inline JSON payload script tag or expected placeholder.`,
      'From the repo root: run `pnpm install` (or `npm install`), then `pnpm run build`.',
      'That runs the CLI bundle build, builds `apps/report`, and copies `dist/report/index.html` next to the CLI output.',
    ].join(' '),
  );
}

function resolveReportSpaTemplatePath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packaged = path.join(here, 'report', 'index.html');
  if (fs.existsSync(packaged)) {
    return packaged;
  }
  const fromSource = path.resolve(here, '../../..', 'dist', 'report', 'index.html');
  if (fs.existsSync(fromSource)) {
    return fromSource;
  }
  throw new Error(
    [
      `Report UI bundle not found (looked for ${packaged} and ${fromSource}).`,
      'The HTML shell is produced by Vite in `apps/report` and must be present when generating HTML reports.',
      'From the repo root: `pnpm run build` (or `pnpm run build:report` then copy per `scripts/report/copy-template.mjs`).',
      'Published npm installs include `dist/report/index.html` next to `dist/cli.js` after a full release build.',
    ].join(' '),
  );
}
