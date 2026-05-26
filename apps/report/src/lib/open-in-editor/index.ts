export type {
  EditorId,
  EditorLinkPolicy,
  GeneratorEnvironment,
  GeneratorRuntimeFamily,
  LinkPolicyReason,
  PathBridge,
  ViewerEnvironment,
  ViewerRuntimeFamily,
} from './types.js';

export { resolveGeneratorEnvironment, generatorFamilyLabel, inferRuntimeFamily } from './generator/resolve.js';
export { detectViewerEnvironment, readViewerSignals, NARROW_MAX_WIDTH_PX } from './viewer/detect.js';
export type { ViewerSignals } from './viewer/detect.js';
export { isSyntheticCwd } from './policy/syntheticCwd.js';
export {
  evaluateEditorLinkPolicy,
  evaluateEditorLinkPolicyFromPayload,
  policyForMissingEnvironment,
} from './policy/evaluate.js';
export type { PolicyInput } from './policy/evaluate.js';
export { linkPolicyReasonMessage } from './policy/messages.js';
export { resolveAbsolutePath } from './paths/resolve.js';
export { presentPathForOpen } from './paths/present.js';
export { copyPathForFallback } from './paths/copyFallback.js';
export { buildOpenUri } from './buildOpenUri.js';
export type { BuildOpenUriInput, BuildOpenUriResult } from './buildOpenUri.js';
export { getEditorAdapter, EDITOR_IDS } from './adapters/registry.js';
export type { EditorUriAdapter } from './adapters/types.js';

export const EDITOR_OPENER_OPTIONS = [
  { value: 'vscode' as const, label: 'VS Code' },
  { value: 'cursor' as const, label: 'Cursor' },
  { value: 'antigravity' as const, label: 'Antigravity' },
  { value: 'windsurf' as const, label: 'Windsurf' },
  { value: 'zed' as const, label: 'Zed' },
] as const;

export type EditorOpener = (typeof EDITOR_OPENER_OPTIONS)[number]['value'];

const STORAGE_KEY = 'i18nprune-report-editor';

function isEditorOpener(v: string): v is EditorOpener {
  return EDITOR_OPENER_OPTIONS.some((o) => o.value === v);
}

export function getStoredEditorOpener(): EditorOpener {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && isEditorOpener(v)) return v;
  } catch {
    /* ignore */
  }
  return 'vscode';
}

export function setStoredEditorOpener(v: EditorOpener): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* ignore */
  }
}
