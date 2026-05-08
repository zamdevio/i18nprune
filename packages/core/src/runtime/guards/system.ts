import { I18nPruneError } from '../../shared/errors/internal.js';
import type { RuntimeFsPort, RuntimeSystemPort } from '../contracts/index.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';
import type { RuntimeNetworkPort } from '../../types/runtime/network.js';

export function assertRuntimeSystemPort(value: Partial<RuntimeSystemPort> | undefined): asserts value is RuntimeSystemPort {
  if (!value || typeof value.cwd !== 'function' || typeof value.now !== 'function') {
    throw new I18nPruneError('Runtime system port is missing required methods (cwd, now)', 'USAGE');
  }
}

export function assertRuntimePathPort(
  value: { join?: unknown; resolve?: unknown; isAbsolute?: unknown } | undefined,
): asserts value is { join: (...parts: string[]) => string; resolve: (...parts: string[]) => string; isAbsolute: (v: string) => boolean } {
  if (!value || typeof value.join !== 'function' || typeof value.resolve !== 'function' || typeof value.isAbsolute !== 'function') {
    throw new I18nPruneError('Runtime path port is missing required methods (join, resolve, isAbsolute)', 'USAGE');
  }
}

export function assertRuntimeFsPort(
  value: Partial<RuntimeFsPort> | undefined,
): asserts value is RuntimeFsPort {
  if (
    !value ||
    typeof value.exists !== 'function' ||
    typeof value.readText !== 'function' ||
    typeof value.statKind !== 'function' ||
    typeof value.listDir !== 'function' ||
    typeof value.writeText !== 'function' ||
    typeof value.deleteFile !== 'function' ||
    typeof value.mkdirp !== 'function'
  ) {
    throw new I18nPruneError(
      'Runtime fs port is missing required methods (exists, readText, statKind, listDir, writeText, deleteFile, mkdirp)',
      'USAGE',
    );
  }
}

export function assertRuntimeNetworkPort(
  value: Partial<RuntimeNetworkPort> | undefined,
): asserts value is RuntimeNetworkPort {
  if (!value || typeof value.fetch !== 'function') {
    throw new I18nPruneError('Runtime network port is missing required `fetch` method', 'USAGE');
  }
}

export function assertRuntimeAdapters(value: Partial<RuntimeAdapters> | undefined): asserts value is RuntimeAdapters {
  assertRuntimeSystemPort(value?.system);
  assertRuntimePathPort(value?.path);
  assertRuntimeFsPort(value?.fs);
  assertRuntimeNetworkPort(value?.network);
  if (!value || (value.kind !== 'node' && value.kind !== 'web' && value.kind !== 'edge')) {
    throw new I18nPruneError('Runtime adapters kind must be one of node/web/edge', 'USAGE');
  }
}
