import fs from 'node:fs';
import path from 'node:path';
import { ConfigValidationError } from '@i18nprune/core/config';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { listDiscoveredConfigFiles } from '../workspace/configFiles';
import { loadWorkspaceI18nConfig } from '../workspace/loadWorkspaceConfig';

export type ConfigValidationIssuePayload = {
  code: string;
  message: string;
  /** Human path, e.g. `translate › policy`. */
  pathLabel: string;
  /** e.g. strict object `unrecognized_keys`. */
  keys?: string[];
};

export type ConfigValidationWarningPayload = {
  title: string;
  summary: string;
  issues: ConfigValidationIssuePayload[];
};

export type ActiveProjectConfigPreview = {
  configPath: string | null;
  rawText: string | null;
  parsedPretty: string;
  hint: string | null;
  /** Schema / parse shape problems — show under raw preview (amber panel). */
  validationWarning?: ConfigValidationWarningPayload | null;
};

function issueKeys(issue: { keys?: unknown }): string[] | undefined {
  const keys = issue.keys;
  if (Array.isArray(keys) && keys.every((k) => typeof k === 'string')) {
    return keys;
  }
  return undefined;
}

function zodIssuesToPayload(issues: readonly object[]): ConfigValidationIssuePayload[] {
  return issues.map((issue) => {
    const rec = issue as Record<string, unknown>;
    const code = typeof rec.code === 'string' ? rec.code : String(rec.code ?? 'issue');
    const message = typeof rec.message === 'string' ? rec.message : String(rec.message ?? '');
    const path = Array.isArray(rec.path) ? rec.path : [];
    const pathLabel =
      path.length > 0 ? path.map((p: PropertyKey) => String(p)).join(' › ') : '(root)';
    return {
      code,
      message,
      pathLabel,
      keys: issueKeys(rec),
    };
  });
}

export async function getActiveProjectConfigPreview(projectRoot: string): Promise<ActiveProjectConfigPreview> {
  const adapters = createNodeRuntimeAdapters();
  const found = listDiscoveredConfigFiles(projectRoot, adapters.fs);

  let parsedPretty: string;
  try {
    const loaded = await loadWorkspaceI18nConfig(projectRoot, adapters);
    parsedPretty = JSON.stringify(loaded.config, null, 2);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (err instanceof ConfigValidationError && err.zodError?.issues?.length) {
      return {
        configPath: found[0] ?? null,
        rawText: found[0] ? safeRead(found[0]) : null,
        parsedPretty: '',
        hint: null,
        validationWarning: {
          title: 'Invalid i18nprune config',
          summary:
            'The file loads, but it does not match the schema expected by this version of @i18nprune/core. Fix the issues below — generate and validation stay disabled until the config parses.',
          issues: zodIssuesToPayload(err.zodError.issues),
        },
      };
    }
    return {
      configPath: found[0] ?? null,
      rawText: found[0] ? safeRead(found[0]) : null,
      parsedPretty: '',
      hint: msg,
      validationWarning: null,
    };
  }

  if (found.length === 0) {
    return {
      configPath: null,
      rawText: null,
      parsedPretty,
      hint: 'No i18nprune.config.* file in this folder — showing merged defaults.',
      validationWarning: null,
    };
  }

  const configPath = found[0]!;
  try {
    const rawText = fs.readFileSync(configPath, 'utf8');
    return {
      configPath,
      rawText,
      parsedPretty,
      hint:
        found.length > 1
          ? `Several config files in this folder (${found.map((f) => path.basename(f)).join(', ')}) — resolve to one. Raw preview uses ${path.basename(configPath)}.`
          : null,
      validationWarning: null,
    };
  } catch (err) {
    return {
      configPath,
      rawText: null,
      parsedPretty,
      hint: err instanceof Error ? err.message : String(err),
      validationWarning: null,
    };
  }
}

function safeRead(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}
