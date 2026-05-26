import type { ProjectReportEnvironment } from '../../types/index.js';

/** Where the scan ran — distinct from viewer family. */
export type GeneratorRuntimeFamily =
  | 'windows'
  | 'darwin'
  | 'linux'
  | 'linux-wsl'
  | 'unsupported';

/** Where the report UI runs (browser heuristic only). */
export type ViewerRuntimeFamily = 'windows' | 'darwin' | 'linux' | 'unknown';

export type LinkPolicyReason =
  | 'generator-environment-unsupported'
  | 'viewer-environment-incompatible'
  | 'wsl-cross-host-unsupported'
  | 'synthetic-cwd'
  | 'mobile-browser'
  | 'missing-runtime-metadata';

export type PathBridge = 'native';

export type EditorLinkPolicy =
  | { allow: true; bridge: PathBridge }
  | { allow: false; reason: LinkPolicyReason };

export type GeneratorEnvironment = {
  family: GeneratorRuntimeFamily;
  /** Raw payload environment when present. */
  source?: ProjectReportEnvironment;
};

export type ViewerEnvironment = {
  family: ViewerRuntimeFamily;
  isCoarsePointer: boolean;
  isNarrowViewport: boolean;
};

export type EditorId = 'vscode' | 'cursor' | 'antigravity' | 'windsurf' | 'zed';

export type PresentedPath = string;

export type ResolvedFileTarget = {
  absolutePath: string;
};
