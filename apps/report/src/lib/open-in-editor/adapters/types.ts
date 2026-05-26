import type { EditorId, PresentedPath } from '../types.js';

export interface EditorUriAdapter {
  readonly id: EditorId;
  buildUri(input: { path: PresentedPath; line?: number; column?: number }): string;
}
