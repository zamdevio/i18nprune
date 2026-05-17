import { buildCliJsonEnvelope, runInit } from '@i18nprune/core';
import type { InitJsonPayload, InitRunOptions, RunInitHostInput } from '@i18nprune/core';
import type { CliJsonEnvelope } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

/** Build the unified CLI **`--json`** envelope for **`init`**. */
export function buildInitJsonEnvelope(input: {
  cwd: string;
  skippedExistingConfig: boolean;
  runOpts: InitRunOptions;
}): CliJsonEnvelope<'init', InitJsonPayload> {
  const adapters = createNodeRuntimeAdapters();
  const host: RunInitHostInput = {
    fs: adapters.fs,
    path: adapters.path,
    projectRoot: input.cwd,
    skippedExistingConfig: input.skippedExistingConfig,
  };
  const result = runInit(host, input.runOpts);
  return buildCliJsonEnvelope('init', result.payload, {
    ok: result.exitCode === 0,
    issues: result.issues,
    cwd: input.cwd,
  });
}
