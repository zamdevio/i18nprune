import { resolveConfigFilePath, listDiscoveredConfigFiles } from '@/shared/config/index.js';
import { buildPatchingSectionIncompleteDiagnostic, existsRuntimeFsSync, patchingBlockPresent } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import {
  patchingLocaleJsonImportBaseForProjectConfig,
  resolvePatchScaffoldPaths,
} from '@/shared/patching/scaffoldI18nLayout.js';
import { PATCHING_CONFIG_BODY_INDENT } from '@/constants/patching.js';
import { replaceStartBeforePropertyKey } from '@/shared/patching/replaceConfigPatchingBlock.js';
import type {
  EnsurePatchingConfigBlockOptions,
  EnsurePatchingConfigBlockResult,
  PatchingConfigInjectionAssessment,
} from '@/types/shared/patching/injectConfigBlock.js';

function toProjectRelativePath(
  pathMod: Context['adapters']['path'],
  projectRoot: string,
  absolutePath: string,
): string {
  return pathMod.relative(projectRoot, absolutePath).replace(/\\/g, '/') || '.';
}

export function buildPatchingSnippet(
  pathMod: Context['adapters']['path'],
  paths: {
    configPath: string;
    loaderPath: string;
    localeJsonImportBase: string;
  },
  projectRoot: string,
): string {
  const bi = PATCHING_CONFIG_BODY_INDENT;
  const rel = (abs: string): string => toProjectRelativePath(pathMod, projectRoot, abs);
  const inner = `${bi}  `;
  return [
    `${bi}patching: {`,
    `${inner}enabled: true,`,
    `${inner}recipe: "loader_generated",`,
    `${inner}configPath: "${rel(paths.configPath)}",`,
    `${inner}loaderPath: "${rel(paths.loaderPath)}",`,
    `${inner}localeJsonImportBase: "${paths.localeJsonImportBase}",`,
    `${bi}},`,
  ].join('\n');
}

const CONFIG_OBJECT_MARKERS: RegExp[] = [
  /export\s+default\s+defineConfig\(\{\s*\n?/g,
  /export\s+default\s+defineConfig\s*\(\s*\{\s*\n/g,
  /export\s+default\s+\{\s*\n?/g,
  /module\.exports\s*=\s*\{\s*\n?/g,
];

function countConfigObjectMarkers(fileText: string): number {
  const starts = new Set<number>();
  for (const marker of CONFIG_OBJECT_MARKERS) {
    const re = new RegExp(marker.source, marker.flags);
    for (const match of fileText.matchAll(re)) {
      if (match.index != null) starts.add(match.index);
    }
  }
  return starts.size;
}

function countPatchingBlocks(fileText: string): number {
  return [...fileText.matchAll(/\bpatching\s*:\s*\{/g)].length;
}

/** Decide whether automatic config injection is safe for this file text. */
export function assessPatchingConfigInjection(fileText: string): PatchingConfigInjectionAssessment {
  if (/\bpatching\s*:/.test(fileText)) {
    return { safe: false, reason: 'a patching block is already present' };
  }
  const markerCount = countConfigObjectMarkers(fileText);
  if (markerCount === 0) {
    return {
      safe: false,
      reason: 'no supported config object opener was found (expected export default defineConfig({, export default {, or module.exports = {)',
    };
  }
  if (markerCount > 1) {
    return {
      safe: false,
      reason: `found ${String(markerCount)} config object openers — automatic insertion could target the wrong block`,
    };
  }
  if (countPatchingBlocks(fileText) > 0) {
    return { safe: false, reason: 'multiple patching blocks detected' };
  }
  return { safe: true };
}

function findConfigObjectInsertPoint(fileText: string): number | null {
  for (const marker of CONFIG_OBJECT_MARKERS) {
    const re = new RegExp(marker.source, marker.flags.replace('g', ''));
    const matched = fileText.match(re);
    if (matched?.index != null) {
      return matched.index + matched[0].length;
    }
  }
  return null;
}

export function tryInjectPatchingConfig(fileText: string, snippet: string): {
  kind: 'updated' | 'skipped_existing' | 'skipped_unrecognized' | 'skipped_unsure';
  text: string;
  reason?: string;
} {
  if (/\bpatching\s*:/.test(fileText)) return { kind: 'skipped_existing', text: fileText };
  const assessment = assessPatchingConfigInjection(fileText);
  if (!assessment.safe) {
    return { kind: 'skipped_unsure', text: fileText, reason: assessment.reason };
  }
  const insertAt = findConfigObjectInsertPoint(fileText);
  if (insertAt == null) return { kind: 'skipped_unrecognized', text: fileText };
  return { kind: 'updated', text: `${fileText.slice(0, insertAt)}${snippet}\n${fileText.slice(insertAt)}` };
}

export function tryReplacePatchingConfig(fileText: string, snippet: string): {
  kind: 'updated' | 'skipped_missing' | 'skipped_unrecognized' | 'skipped_unsure';
  text: string;
  reason?: string;
} {
  const blockCount = countPatchingBlocks(fileText);
  if (blockCount === 0) return { kind: 'skipped_missing', text: fileText };
  if (blockCount > 1) {
    return {
      kind: 'skipped_unsure',
      text: fileText,
      reason: `found ${String(blockCount)} patching blocks — automatic replacement could corrupt the file`,
    };
  }
  const keyRe = /\bpatching\s*:\s*\{/g;
  const m = keyRe.exec(fileText);
  if (!m || m.index == null) return { kind: 'skipped_missing', text: fileText };
  const braceStart = fileText.indexOf('{', m.index);
  if (braceStart < 0) return { kind: 'skipped_unrecognized', text: fileText };
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < fileText.length; i += 1) {
    const ch = fileText[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) return { kind: 'skipped_unrecognized', text: fileText };
  let tailEnd = end;
  while (tailEnd < fileText.length && /\s/.test(fileText[tailEnd]!)) tailEnd += 1;
  if (fileText[tailEnd] === ',') tailEnd += 1;
  const replaceStart = replaceStartBeforePropertyKey(fileText, m.index);
  return {
    kind: 'updated',
    text: `${fileText.slice(0, replaceStart)}${snippet}${fileText.slice(tailEnd)}`,
  };
}

function resolveInjectionTargetConfigPath(ctx: Context): {
  path: string | null;
  status?: 'skipped_multiple_configs' | 'skipped_no_config_file';
  skipReason?: string;
} {
  const cwd = ctx.adapters.system.cwd();
  const explicit = resolveConfigFilePath(cwd);
  if (explicit) return { path: explicit };

  const discovered = listDiscoveredConfigFiles(cwd);
  if (discovered.length === 0) {
    return { path: null, status: 'skipped_no_config_file' };
  }
  if (discovered.length > 1) {
    const names = discovered.map((p) => ctx.adapters.path.basename(p)).join(', ');
    return {
      path: null,
      status: 'skipped_multiple_configs',
      skipReason: `multiple i18nprune config files (${names}) — pass --config to choose one`,
    };
  }
  return { path: discovered[0]! };
}

function buildSuggestedSnippet(ctx: Context, configFilePath: string): string {
  const paths = resolvePatchScaffoldPaths(ctx);
  const projectRoot = ctx.adapters.path.dirname(configFilePath);
  const localeJsonImportBase = patchingLocaleJsonImportBaseForProjectConfig(ctx, configFilePath);
  return buildPatchingSnippet(
    ctx.adapters.path,
    { ...paths, localeJsonImportBase },
    projectRoot,
  );
}

/**
 * Inject or refresh the **`patching: {}`** block in **`i18nprune.config.*`** when missing or incomplete.
 * Skips when ambiguous and returns a copy-paste snippet for manual insertion.
 */
export async function ensurePatchingConfigBlock(
  ctx: Context,
  opts?: EnsurePatchingConfigBlockOptions,
): Promise<EnsurePatchingConfigBlockResult> {
  const target = resolveInjectionTargetConfigPath(ctx);
  if (!target.path || target.status) {
    const snippetPath = resolveConfigFilePath(ctx.adapters.system.cwd()) ?? target.path;
    const suggestedSnippet =
      snippetPath != null ? buildSuggestedSnippet(ctx, snippetPath) : buildSuggestedSnippet(ctx, ctx.adapters.system.cwd());
    return {
      status: target.status ?? 'skipped_no_config_file',
      configUpdated: false,
      suggestedSnippet,
      skipReason: target.skipReason,
    };
  }

  const cfgPath = target.path;
  if (!existsRuntimeFsSync(cfgPath, ctx.adapters.fs)) {
    return {
      status: 'skipped_no_config_file',
      configUpdated: false,
      suggestedSnippet: buildSuggestedSnippet(ctx, cfgPath),
      configFilePath: cfgPath,
    };
  }

  const suggestedSnippet = buildSuggestedSnippet(ctx, cfgPath);
  const incomplete = buildPatchingSectionIncompleteDiagnostic(ctx.config.patching, {
    effectiveWantsRun: true,
  });
  const blockPresent = patchingBlockPresent(ctx.config.patching);
  const shouldInject = !blockPresent;
  const shouldReplace = blockPresent && Boolean(opts?.refreshIfIncomplete && incomplete);
  if (!shouldInject && !shouldReplace) {
    return {
      status: 'skipped_existing',
      configUpdated: false,
      suggestedSnippet,
      configFilePath: cfgPath,
    };
  }

  const current = await Promise.resolve(ctx.adapters.fs.readText(cfgPath));

  if (blockPresent && shouldReplace) {
    const replaced = tryReplacePatchingConfig(current, suggestedSnippet);
    if (replaced.kind === 'updated' && replaced.text !== current) {
      await Promise.resolve(ctx.adapters.fs.writeText(cfgPath, replaced.text));
      return { status: 'updated', configUpdated: true, suggestedSnippet, configFilePath: cfgPath };
    }
    if (replaced.kind === 'skipped_unsure') {
      return {
        status: 'skipped_unsure',
        configUpdated: false,
        suggestedSnippet,
        configFilePath: cfgPath,
        skipReason: replaced.reason,
      };
    }
    return {
      status: replaced.kind === 'skipped_unrecognized' ? 'skipped_unrecognized' : 'skipped_existing',
      configUpdated: false,
      suggestedSnippet,
      configFilePath: cfgPath,
      skipReason: replaced.reason,
    };
  }

  const injected = tryInjectPatchingConfig(current, suggestedSnippet);
  if (injected.kind === 'updated' && injected.text !== current) {
    await Promise.resolve(ctx.adapters.fs.writeText(cfgPath, injected.text));
    return { status: 'updated', configUpdated: true, suggestedSnippet, configFilePath: cfgPath };
  }
  return {
    status: injected.kind === 'skipped_unsure' ? 'skipped_unsure' : injected.kind,
    configUpdated: false,
    suggestedSnippet,
    configFilePath: cfgPath,
    skipReason: injected.reason,
  };
}

export function formatPatchingSnippetForManualCopy(snippet: string): string {
  return snippet.trimEnd();
}
