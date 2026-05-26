import { getEditorAdapter } from './adapters/registry.js';
import { presentPathForOpen } from './paths/present.js';
import { resolveAbsolutePath } from './paths/resolve.js';
import type {
  EditorId,
  EditorLinkPolicy,
  GeneratorRuntimeFamily,
  ResolvedFileTarget,
} from './types.js';

export type BuildOpenUriInput = {
  policy: EditorLinkPolicy;
  generatorFamily: GeneratorRuntimeFamily;
  editorId: EditorId;
  cwd: string;
  payloadPath: string;
  line?: number;
  column?: number;
};

export type BuildOpenUriResult =
  | { ok: true; uri: string; target: ResolvedFileTarget }
  | { ok: false };

/**
 * Build an editor URI only when policy allows. Never emits optimistic URIs.
 */
export function buildOpenUri(input: BuildOpenUriInput): BuildOpenUriResult {
  if (!input.policy.allow) {
    return { ok: false };
  }

  const target = resolveAbsolutePath(input.cwd, input.payloadPath);
  const presented = presentPathForOpen({
    target,
    generatorFamily: input.generatorFamily,
    bridge: input.policy.bridge,
  });
  const uri = getEditorAdapter(input.editorId).buildUri({
    path: presented,
    line: input.line,
    column: input.column,
  });

  return { ok: true, uri, target };
}
