import { resolveListWindow } from '../../shared/options/index.js';
import { resolveScannerConfig } from '../../shared/scanner/config.js';
import type { CoreConfigInput, CoreConfigResolved, ResolveCoreConfigOptions } from '../../types/config/index.js';

export type CoreConfigLayer = {
  /** Optional label for debugging/traceability (host-defined). */
  name?: string;
  input: CoreConfigInput;
};

export function mergeCoreConfigInputs(a: CoreConfigInput | undefined, b: CoreConfigInput | undefined): CoreConfigInput {
  return {
    output: {
      list: {
        ...(a?.output?.list ?? {}),
        ...(b?.output?.list ?? {}),
      },
    },
    scanner: {
      ...(a?.scanner ?? {}),
      ...(b?.scanner ?? {}),
    },
    cache: {
      ...(a?.cache ?? {}),
      ...(b?.cache ?? {}),
    },
  };
}

/** Resolve portable core config (defaults + clamp rules), independent of any host parser. */
export function resolveCoreConfig(
  input?: CoreConfigInput,
  options?: ResolveCoreConfigOptions,
): CoreConfigResolved {
  const list = input?.output?.list;
  return {
    output: {
      list: resolveListWindow(
        list ? { top: list.top, full: list.full } : undefined,
        {
          ...options?.listWindow,
          ...(typeof list?.maxCap === 'number' ? { hardCap: list.maxCap } : {}),
        },
      ),
    },
    scanner: resolveScannerConfig(input?.scanner, options?.scanner),
    cache: {
      enabled: input?.cache?.enabled ?? true,
      mode: input?.cache?.mode === 'readOnly' ? 'readOnly' : 'readWrite',
      rebuild: input?.cache?.rebuild === 'full' ? 'full' : 'partial',
      fullRescanThresholdPercent: input?.cache?.fullRescanThresholdPercent ?? 40,
      ...(input?.cache?.dir !== undefined ? { dir: input.cache.dir } : {}),
    },
  };
}

/**
 * Resolve core config from multiple layers. Merge semantics: later layers override earlier.
 * Hosts can use this to combine defaults + file config + flags in a deterministic order.
 */
export function resolveCoreConfigLayers(
  layers: readonly CoreConfigLayer[],
  options?: ResolveCoreConfigOptions,
): CoreConfigResolved {
  const merged = layers.reduce<CoreConfigInput>((acc, layer) => mergeCoreConfigInputs(acc, layer.input), {});
  return resolveCoreConfig(merged, options);
}
