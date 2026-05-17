import type { CoreContext } from '../../../types/generate/index.js';
import { ISSUE_IO_READ_FAILED } from '../../constants/issueCodes.js';
import { I18nPruneError } from '../../errors/index.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { readLocaleBundle } from '../read/bundle.js';
import { writeLocaleBundle } from '../write/bundle.js';

/** Read one locale JSON file via {@link readLocaleBundle} and {@link CoreContext} layout. */
export function readLocaleJsonFromContextSync(ctx: CoreContext, absoluteFile: string): unknown {
  const read = readLocaleBundle({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
    absoluteFile,
  });
  if (!read.ok) {
    const message = read.diagnostics.map((d) => d.message).join(' · ') || 'failed to read locale JSON';
    throw new I18nPruneError(message, 'IO', { issueCode: ISSUE_IO_READ_FAILED });
  }
  return read.document;
}

/** Persist one locale JSON file via {@link writeLocaleBundle} and {@link CoreContext} layout. */
export function writeLocaleJsonFromContextSync(ctx: CoreContext, absoluteFile: string, data: unknown): void {
  const result = writeLocaleBundle({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
    absoluteFile,
    data,
  });
  if (!result.ok) {
    const message = result.diagnostics.map((d) => d.message).join(' · ') || 'failed to write locale JSON';
    throw new I18nPruneError(message, 'IO', { issueCode: ISSUE_IO_READ_FAILED });
  }
}
