import type { RuntimeAdapters } from '../../types/runtime/adapters.js';

/** Pretty JSON + trailing newline; mirrors CLI **`writeHostJson`**. */
export function writeRuntimeJsonPretty(filePath: string, data: unknown, adapters: RuntimeAdapters): void {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  adapters.fs.mkdirp(adapters.path.dirname(filePath));
  adapters.fs.writeText(filePath, body);
}
