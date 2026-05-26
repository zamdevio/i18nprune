import type { EditorId } from '../types.js';
import type { EditorUriAdapter } from './types.js';

/** Pure URI serializer: `scheme://file` + path. No environment or policy logic. */
export function createFileSchemeAdapter(scheme: string, id: EditorId): EditorUriAdapter {
  return {
    id,
    buildUri({ path }) {
      const normalized = path.replace(/\\/g, '/');
      const pathPart = normalized.startsWith('/') ? normalized : `/${normalized}`;
      return `${scheme}://file${pathPart}`;
    },
  };
}
