import type { RuntimeFsPort } from '../types/runtime/fs.js';
import {
  existsRuntimeFsSync,
  readRuntimeFsTextSync,
} from '../runtime/helpers/sync/fs.js';
import type { ProjectReportDocument } from '../shared/report/types.js';

/** Directory of the current module — no node:path (Vite browser bundles import this file via core barrel). */
function moduleDirname(metaUrl: string): string {
  const pathname = new URL(metaUrl).pathname;
  const decoded = decodeURIComponent(pathname);
  const normalized = /^\/[A-Za-z]:/.test(decoded) ? decoded.slice(1) : decoded;
  const slash = normalized.lastIndexOf('/');
  return slash >= 0 ? normalized.slice(0, slash) : normalized;
}

function joinModulePath(base: string, ...segments: string[]): string {
  const sep = base.includes('\\') ? '\\' : '/';
  return [base, ...segments]
    .map((part, index) => (index === 0 ? part : part.replace(/^[/\\]+/, '')))
    .join(sep)
    .replace(sep === '\\' ? /\\+/g : /\/+/g, sep);
}

export type ReportHtmlRenderOptions = {
  fs: RuntimeFsPort;
  /** Override template path (defaults to packaged `dist/report/index.html`). */
  templatePath?: string;
};

/**
 * Loads the Vite-built single-file report UI and injects the JSON payload into
 * `#i18nprune-inline-payload`.
 *
 * Injection replaces **only** the payload script body. A global replace of
 * `__I18NPRUNE_REPORT__` would corrupt bundled JS that embeds the same literal.
 */
export function renderReportHtml(
  document: ProjectReportDocument,
  options: ReportHtmlRenderOptions,
): string {
  const templatePath = options.templatePath ?? resolveReportSpaTemplatePath(options.fs);
  const tpl = readRuntimeFsTextSync(templatePath, options.fs);
  const safeJson = JSON.stringify(document)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return injectJsonIntoPayloadScript(tpl, safeJson, templatePath);
}

/** Replaces inner HTML of `#i18nprune-inline-payload` only. */
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
      'Build apps/report and copy dist/report/index.html into @i18nprune/core (see scripts/report/copy-into-core.mjs).',
    ].join(' '),
  );
}

export function resolveReportSpaTemplatePath(fs: RuntimeFsPort): string {
  const here = moduleDirname(import.meta.url);
  const packaged = joinModulePath(here, 'report', 'index.html');
  if (existsRuntimeFsSync(packaged, fs)) {
    return packaged;
  }
  throw new Error(
    [
      `Report UI bundle not found at ${packaged}.`,
      'The HTML shell is produced by Vite in apps/report and copied to packages/core/dist/report/index.html during core build.',
    ].join(' '),
  );
}
