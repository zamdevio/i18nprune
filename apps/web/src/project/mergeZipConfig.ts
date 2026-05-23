import { mergePartialConfigIntoBase } from '@i18nprune/core';
import { normalizeProjectConfig } from '@i18nprune/core';
import { parseZipToSnapshot } from '@i18nprune/core';

/**
 * Parse zip bytes and merge optional `configJson` text onto zip-detected config.
 * Used by Home open panel and Workspace override validation.
 */
export function mergeConfigJsonOntoZipBase(
  zipBytes: Uint8Array,
  configJsonText: string | undefined,
):
  | { ok: true; merged: Record<string, unknown>; zipBase: Record<string, unknown> | null }
  | { ok: false; message: string } {
  const snap = parseZipToSnapshot('preview', 'preview', zipBytes).snapshot;
  const zipBase = snap.resolvedConfig;
  if (typeof configJsonText !== 'string' || !configJsonText.trim()) {
    if (!normalizeProjectConfig(zipBase ?? {})) {
      return {
        ok: false,
        message:
          'Zip has no usable i18nprune config and no configJson override was provided (need locales.source, locales.directory, src, functions[]).',
      };
    }
    return { ok: true, merged: zipBase ?? {}, zipBase };
  }
  let partial: Record<string, unknown>;
  try {
    const parsed = JSON.parse(configJsonText) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, message: 'configJson must be a JSON object.' };
    }
    partial = parsed as Record<string, unknown>;
  } catch (e) {
    return { ok: false, message: e instanceof Error ? `Invalid JSON: ${e.message}` : 'Invalid JSON.' };
  }
  const merged = mergePartialConfigIntoBase(zipBase, partial);
  if (!normalizeProjectConfig(merged)) {
    return {
      ok: false,
      message:
        'After merging configJson with the zip config, required fields are still missing: locales.source, locales.directory, src, functions[].',
    };
  }
  return { ok: true, merged, zipBase };
}
