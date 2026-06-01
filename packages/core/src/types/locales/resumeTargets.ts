import type { CoreContext } from '../context/index.js';

export type ResolveResumeTargetCodesFromRawInput = {
  commandName: string;
  /** Non-empty selector string (after `pickTargetSelector`), including `all` or comma-separated codes. */
  raw: string;
  ctx: CoreContext;
};
