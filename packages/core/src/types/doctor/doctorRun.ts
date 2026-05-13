import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { DoctorFinding } from './doctorFinding.js';

/** Per-call options for `runDoctor`. */
export type DoctorRunOptions = {
  /** Comma-separated list of check IDs to run (e.g. `"runtime,paths"`). Omit to run all. */
  only?: string;
  /** When true, warnings are treated as errors for exit-code purposes. */
  strict?: boolean;
};

/**
 * Host-supplied environment facts that core cannot discover on its own.
 *
 * @remarks Doctor checks are pure — core never calls `process.*` or probes the filesystem
 * directly. The host (CLI, SDK consumer, test harness) reads the real environment and
 * passes the facts here.
 */
export type DoctorHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  /** `process.version` string (e.g. `"v20.18.2"`). */
  nodeVersion: string;
  /** Whether `rg` (ripgrep) is available on `$PATH`. */
  rgAvailable: boolean;
  /** Whether an `i18nprune.config.*` file was found. */
  hasConfigFile: boolean;
  /** Display label for the resolved config file path (or `null` when no file). */
  configPathLabel: string | null;
};

/** Result returned by `runDoctor`. */
export type DoctorRunResult = {
  payload: DoctorJsonPayload;
  issues: Issue[];
  exitCode: number;
};

/** JSON `data` shape for the `doctor` envelope. */
export type DoctorJsonPayload = {
  kind: 'doctor';
  findings: DoctorFinding[];
  strict: boolean;
};
