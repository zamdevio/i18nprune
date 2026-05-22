function parseFunctionsArray(raw: string): string[] {
  const quoted = raw.match(/['"`]([^'"`]+)['"`]/g) ?? [];
  const values = quoted
    .map((token) => token.slice(1, -1).trim())
    .filter((v) => v.length > 0);
  return [...new Set(values)];
}

function parseQuotedOrBareToken(raw: string, key: string): string | null {
  const quoted = raw.match(new RegExp(`\\b${key}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`))?.[1];
  if (quoted) return quoted;
  const bare = raw.match(new RegExp(`\\b${key}\\s*:\\s*([a-z_]+)`))?.[1];
  return bare ?? null;
}

/** Best-effort parse of `i18nprune.config.ts` / `.mjs` / `.js` for share snapshot shells and zip ingest. */
export function tryParseConfigObjectFromTsOrJs(raw: string): Record<string, unknown> | null {
  const compact = raw.replace(/\r\n/g, '\n');
  const localesBlock = compact.match(/\blocales\s*:\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const source = parseQuotedOrBareToken(localesBlock, 'source');
  const directory = parseQuotedOrBareToken(localesBlock, 'directory');
  const modeRaw = parseQuotedOrBareToken(localesBlock, 'mode');
  const structureRaw = parseQuotedOrBareToken(localesBlock, 'structure');
  const src = compact.match(/\bsrc\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;
  const functionsRaw = compact.match(/\bfunctions\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? null;
  const functions = functionsRaw ? parseFunctionsArray(functionsRaw) : [];
  if (!source || !directory || !src || functions.length === 0) return null;

  const locales: Record<string, unknown> = { source, directory };
  if (modeRaw === 'flat_file' || modeRaw === 'locale_directory') {
    locales.mode = modeRaw;
  }
  if (
    structureRaw === 'locale_file' ||
    structureRaw === 'locale_per_dir' ||
    structureRaw === 'feature_bundle'
  ) {
    locales.structure = structureRaw;
  }

  return {
    locales,
    src,
    functions,
  };
}
