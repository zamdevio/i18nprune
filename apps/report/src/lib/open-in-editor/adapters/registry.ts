import type { EditorId } from '../types.js';
import { createFileSchemeAdapter } from './createFileSchemeAdapter.js';
import type { EditorUriAdapter } from './types.js';

const ADAPTERS: Record<EditorId, EditorUriAdapter> = {
  vscode: createFileSchemeAdapter('vscode', 'vscode'),
  cursor: createFileSchemeAdapter('cursor', 'cursor'),
  antigravity: createFileSchemeAdapter('antigravity', 'antigravity'),
  windsurf: createFileSchemeAdapter('windsurf', 'windsurf'),
  zed: createFileSchemeAdapter('zed', 'zed'),
};

export function getEditorAdapter(id: EditorId): EditorUriAdapter {
  return ADAPTERS[id];
}
