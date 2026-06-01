import type { Issue } from '../json/envelope/index.js';
import type { RuntimeFsPort } from '../runtime/fs.js';
import type { RuntimePathPort } from '../runtime/path.js';

/** Curated starter bundles for **`i18nprune init --preset`**. */
export type InitPresetId =
  | 'generic'
  | 'i18next'
  | 'lingui'
  | 'next-i18next'
  | 'next-intl'
  | 'react-intl';

/** One explainable scoring dimension (library, topology, convention, …). */
export type InitScoreFactor = {
  /** Stable machine id, e.g. **`npm.next-intl`**, **`dir.messages`**. */
  id: string;
  /** Contribution after weighting (non-negative). */
  contribution: number;
  /** Short human/SDK-facing note. */
  detail: string;
};

/** A single preset’s aggregate score from weighted heuristics. */
export type InitPresetScore = {
  preset: InitPresetId;
  /** Sum of weighted contributions before conflict damping (0–1+). */
  rawScore: number;
  /** Score after conflict / ambiguity damping (0–1). */
  score: number;
  /** Normalized confidence for this preset (0–1). */
  confidence: number;
  factors: InitScoreFactor[];
};

/** Parsed **`package.json`** dependency maps (empty when file missing / invalid). */
export type InitPackageJsonSignals = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

/** Confident `locales.mode` / `locales.structure` inferred from on-disk JSON segments. */
export type InitLocaleLayoutHint = {
  mode: 'flat_file' | 'locale_directory';
  structure: 'locale_file' | 'locale_per_dir' | 'feature_bundle';
  /** Normalized confidence (1 when all segments agree). */
  confidence: number;
  /** Number of JSON segment files that contributed to the hint. */
  segmentCount: number;
};

/** Filesystem hints under **`projectRoot`** (locale roots, framework markers). */
export type InitTopologySignals = {
  /** Project-relative directory roots that exist and look like locale containers. */
  localeRoots: string[];
  /** True when **`next.config.js`**, **`.mjs`**, or **`.ts`** exists at project root. */
  nextConfigPresent: boolean;
};

export type InitProjectSignals = {
  packageJson: InitPackageJsonSignals | null;
  topology: InitTopologySignals;
};

export type InitRunOptions = {
  /**
   * When true, pick a preset from scored heuristics (may refuse if ambiguous).
   * Ignored when **`preset`** is set — explicit preset always wins.
   */
  auto?: boolean;
  /** Force a specific preset id; overrides **`auto`**. */
  preset?: string;
  /** Same as CLI **`--rich`** — expanded starter template. */
  rich?: boolean;
  /** Module specifier for **`defineConfig`** (default **`i18nprune/core/config`**). */
  importSpecifier?: string;
};

/**
 * Host filesystem + path ports for **`runInit`** (no config load — **`projectRoot`** is absolute).
 *
 * @remarks Uses the same **`fs`** + **`path`** ports as project scanning; init never uses **`network`**.
 */
export type InitFilesystemHost = {
  fs: RuntimeFsPort;
  path: RuntimePathPort;
};

/** Host input for **`runInit`** — filesystem ports plus absolute **`projectRoot`**. */
export type RunInitHostInput = InitFilesystemHost & {
  /** Absolute project directory (the directory where a config file would be written). */
  projectRoot: string;
  /** When true, the host found an existing **`i18nprune.config.*`** — core skips template generation. */
  skippedExistingConfig: boolean;
};

export type InitJsonPayload = {
  kind: 'init';
  /** Payload contract version for **`--json`** stability. */
  schemaVersion: 1;
  /** Whether an on-disk config already exists — host supplies; no write attempted. */
  skippedExistingConfig: boolean;
  /** Resolved preset for the proposed template (after **`auto`** / **`preset`** rules). */
  preset: InitPresetId;
  /** Full config file contents the host may write (UTF-8 text). */
  proposedConfigSource: string;
  /** Relative filename only, e.g. **`i18nprune.config.ts`**. */
  proposedConfigFileName: string;
  /** Detection + scoring (omitted when **`skippedExistingConfig`**). */
  detection?: {
    signals: InitProjectSignals;
    scores: InitPresetScore[];
    ambiguous: boolean;
    /** Present when segment paths under the preset `locales.directory` agree on one layout. */
    localeLayout?: InitLocaleLayoutHint | null;
  };
};

export type InitRunResult = {
  payload: InitJsonPayload;
  issues: Issue[];
  /** CLI exit code: **`0`** on success / benign skip; **`1`** on blocking issues. */
  exitCode: number;
};
