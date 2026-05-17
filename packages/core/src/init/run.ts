import type { Issue } from '../types/json/envelope/index.js';
import type {
  InitFilesystemHost,
  InitJsonPayload,
  InitRunOptions,
  InitRunResult,
  InitPresetId,
} from '../types/init/index.js';
import { buildInitConfigTemplate, defaultInitConfigFileName } from './template.js';
import {
  detectInitProject,
  detectLocaleFilesystemLayout,
  inferLocaleLayoutFromConfigPaths,
  isInitAutoAmbiguous,
  pickTopInitPreset,
} from './detect/index.js';
import { formatInitPresetIdList, getInitPresetConfigFields, isInitPresetId } from './presets/fields.js';

export type RunInitHostInput = InitFilesystemHost & {
  /** Absolute project directory (the directory where a config file would be written). */
  projectRoot: string;
  /** When true, the host found an existing **`i18nprune.config.*`** — core skips template generation. */
  skippedExistingConfig: boolean;
};

/**
 * Plan an **`init`** config scaffold from optional **`--auto`** / **`--preset`** inputs.
 *
 * @param host - Filesystem + path ports and **`projectRoot`** (absolute).
 * @param opts - **`auto`**, **`preset`**, **`rich`**, and optional **`importSpecifier`**.
 * @returns JSON payload for hosts, diagnostic **`issues`**, and an **`exitCode`** (`1` when auto-selection is blocked).
 *
 * @remarks **Pure** aside from host port reads — never writes files. Hosts own **`console.*`** and disk writes.
 */
export function runInit(host: RunInitHostInput, opts: InitRunOptions = {}): InitRunResult {
  if (host.skippedExistingConfig) {
    const payload: InitJsonPayload = {
      kind: 'init',
      schemaVersion: 1,
      skippedExistingConfig: true,
      preset: 'generic',
      proposedConfigSource: '',
      proposedConfigFileName: defaultInitConfigFileName('i18nprune.config'),
    };
    return { payload, issues: [], exitCode: 0 };
  }

  const presetArg = opts.preset;
  if (presetArg !== undefined && !isInitPresetId(presetArg)) {
    const issue: Issue = {
      severity: 'error',
      code: 'i18nprune.init.unknown_preset',
      message: `Unknown init preset "${String(presetArg)}" (expected one of: ${formatInitPresetIdList()}).`,
    };
    const payload: InitJsonPayload = {
      kind: 'init',
      schemaVersion: 1,
      skippedExistingConfig: false,
      preset: 'generic',
      proposedConfigSource: '',
      proposedConfigFileName: defaultInitConfigFileName('i18nprune.config'),
    };
    return { payload, issues: [issue], exitCode: 1 };
  }

  const { signals, scores } = detectInitProject(host, host.projectRoot);
  const ambiguous = Boolean(opts.auto) && presetArg === undefined && isInitAutoAmbiguous(scores);

  let preset: InitPresetId = 'generic';
  if (presetArg !== undefined) {
    preset = presetArg;
  } else if (opts.auto) {
    preset = pickTopInitPreset(scores);
  }

  const presetFields = getInitPresetConfigFields(preset);
  const localeLayout =
    detectLocaleFilesystemLayout(host, host.projectRoot, presetFields.locales.directory) ??
    inferLocaleLayoutFromConfigPaths(presetFields.locales.directory, presetFields.locales.source);

  const detection = {
    signals,
    scores,
    ambiguous,
    localeLayout,
  };

  const issues: Issue[] = [];
  let exitCode = 0;
  if (ambiguous) {
    issues.push({
      severity: 'error',
      code: 'i18nprune.init.ambiguous_auto',
      message: `Could not pick a unique preset from project signals — pass \`--preset <${formatInitPresetIdList()}>\` or retry without \`--auto\`.`,
    });
    exitCode = 1;
  }

  const proposedConfigSource =
    exitCode === 1
      ? ''
      : buildInitConfigTemplate({
          importSpecifier: opts.importSpecifier,
          rich: opts.rich,
          preset,
          localeLayout,
        });

  const payload: InitJsonPayload = {
    kind: 'init',
    schemaVersion: 1,
    skippedExistingConfig: false,
    preset,
    proposedConfigSource,
    proposedConfigFileName: defaultInitConfigFileName('i18nprune.config'),
    detection,
  };

  return { payload, issues, exitCode };
}
