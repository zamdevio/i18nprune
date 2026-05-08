import type { RuntimePathPort } from '../contracts/index.js';

function split(value: string): string[] {
  return value.replace(/\\/g, '/').split('/').filter((s) => s.length > 0);
}

export const webPathRuntime: RuntimePathPort = {
  join: (...parts) => parts.join('/').replace(/\/+/g, '/'),
  dirname: (value) => {
    const parts = split(value);
    return parts.length <= 1 ? '/' : `/${parts.slice(0, -1).join('/')}`;
  },
  basename: (value, ext) => {
    const parts = split(value);
    const base = parts[parts.length - 1] ?? '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  },
  normalize: (value) => value.replace(/\\/g, '/').replace(/\/+/g, '/'),
  relative: (_from, to) => to,
  resolve: (...parts) => webPathRuntime.normalize(parts.join('/')),
  isAbsolute: (value) => value.startsWith('/'),
};
