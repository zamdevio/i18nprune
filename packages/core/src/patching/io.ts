import type { PatchingDiagnostic, PatchingResult, PatchingRunInput, ResolvedPatchingConfig } from '../types/patching/index.js';
import { toMessage } from './utils.js';

/** Read text when the path is a file; return empty string when missing (no diagnostics). */
export async function readTextFileOrEmpty(
  runtime: PatchingRunInput['runtime'],
  filePath: string,
): Promise<string> {
  const kind = await Promise.resolve(runtime.fs.statKind(filePath));
  if (kind !== 'file') return '';
  try {
    return await Promise.resolve(runtime.fs.readText(filePath));
  } catch {
    return '';
  }
}

export async function readFileSafe(
  runtime: PatchingRunInput['runtime'],
  filePath: string,
): Promise<
  { ok: true; content: string } | { ok: false; diagnostics: PatchingDiagnostic[]; skipReason: PatchingResult['skipReason'] }
> {
  const kind = await Promise.resolve(runtime.fs.statKind(filePath));
  if (kind === 'missing') {
    return {
      ok: false,
      skipReason: 'not_found',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.file_not_found',
          message: `patching: file not found: ${filePath}`,
          docPath: 'patching/README',
        },
      ],
    };
  }
  if (kind !== 'file') {
    return {
      ok: false,
      skipReason: 'not_file',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.path_not_file',
          message: `patching: path is not a file: ${filePath}`,
          docPath: 'patching/README',
        },
      ],
    };
  }
  try {
    const content = await Promise.resolve(runtime.fs.readText(filePath));
    return { ok: true, content };
  } catch (err) {
    return {
      ok: false,
      skipReason: 'parse_error',
      diagnostics: [
        {
          severity: 'warn',
          code: 'i18nprune.patching.read_failed',
          message: `patching: failed to read ${filePath}: ${toMessage(err)}`,
          docPath: 'patching/README',
        },
      ],
    };
  }
}

function defaultLocalesDir(runtime: PatchingRunInput['runtime'], configPath: string): string {
  return runtime.path.join(runtime.path.dirname(configPath), 'locales');
}

/** Resolve config / loader paths relative to `projectRoot` when set. */
export function resolvePatchingFilePath(
  runtime: PatchingRunInput['runtime'],
  projectRoot: string | undefined,
  filePath: string,
): string {
  if (!filePath) return filePath;
  if (projectRoot && !runtime.path.isAbsolute(filePath)) {
    return runtime.path.resolve(projectRoot, filePath);
  }
  return filePath;
}

/**
 * Resolved directory of locale `*.json` files for drift checks.
 * With **`projectRoot`**: `localeJsonImportBase` is relative to that root (e.g. **`locales`**).
 * Without: `localeJsonImportBase` is resolved from the generated loader file’s directory (unit tests).
 */
export function resolveLocalesDir(
  runtime: PatchingRunInput['runtime'],
  config: ResolvedPatchingConfig,
  projectRoot?: string,
): string {
  const loaderAbs = resolvePatchingFilePath(runtime, projectRoot, config.loaderPath);
  if (projectRoot && config.localeJsonImportBase) {
    return runtime.path.resolve(projectRoot, config.localeJsonImportBase);
  }
  if (config.loaderPath && config.localeJsonImportBase) {
    const generatedDir = runtime.path.dirname(loaderAbs);
    return runtime.path.resolve(generatedDir, config.localeJsonImportBase);
  }
  const cfgAbs = resolvePatchingFilePath(runtime, projectRoot, config.configPath);
  return defaultLocalesDir(runtime, cfgAbs);
}

/** `import()` path prefix inside `loaders.generated.ts` — relative from that file to the locale directory. */
export function computeGeneratedModuleImportBase(
  runtime: PatchingRunInput['runtime'],
  config: ResolvedPatchingConfig,
  projectRoot?: string,
): string {
  const localesAbs = resolveLocalesDir(runtime, config, projectRoot);
  const loaderAbs = resolvePatchingFilePath(runtime, projectRoot, config.loaderPath);
  const genDir = runtime.path.dirname(loaderAbs);
  let rel = runtime.path.relative(genDir, localesAbs).replace(/\\/g, '/');
  if (!rel || rel === '') rel = '.';
  return rel;
}

export function listLocaleFilesFromDir(runtime: PatchingRunInput['runtime'], localesDir: string): string[] {
  const kind = runtime.fs.statKind(localesDir);
  const entries = kind === 'directory' ? runtime.fs.listDir(localesDir) : [];
  return (Array.isArray(entries) ? entries : [])
    .filter((e) => e.kind === 'file' && e.name.endsWith('.json') && !e.name.endsWith('.meta.json'))
    .map((e) => e.name.slice(0, -5));
}
