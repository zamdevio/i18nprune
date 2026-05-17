import type { CoreContext } from '../../../types/context/index.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { listLocaleCodes } from './listLocaleCodes.js';
import { listLocaleSegments } from './listLocaleSegments.js';

export function listLocaleSegmentsFromContext(ctx: CoreContext) {
  return listLocaleSegments({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
  });
}

export function listLocaleCodesFromContext(ctx: CoreContext) {
  return listLocaleCodes({
    layout: resolveLocalesLayoutFromContext(ctx),
    fs: ctx.adapters.fs,
    path: ctx.adapters.path,
  });
}
