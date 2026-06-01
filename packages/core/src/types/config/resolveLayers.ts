import type { CoreConfigInput, ResolveCoreConfigOptions } from './core.js';
import type { ConfigPathSystemRuntime } from '../runtime/capabilities.js';

export type CoreConfigLayer = {
  /** Optional label for debugging/traceability (host-defined). */
  name?: string;
  input: CoreConfigInput;
};

type ParseConfigText = (text: string, configPath: string) => unknown | Promise<unknown>;

export type LoadCoreConfigFromPathInput = {
  configPath: string;
  readText: (configPath: string) => string | Promise<string>;
  parseText?: ParseConfigText;
  resolveOptions?: ResolveCoreConfigOptions;
  runtime?: ConfigPathSystemRuntime;
};
