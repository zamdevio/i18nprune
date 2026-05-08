export const LIST_WINDOW_DEFAULT_TOP = 200;
export const LIST_WINDOW_HARD_CAP = 10_000;

/**
 * Portable list window input that clients can map from flags, UI controls, or API params.
 * `full` means "return as much as possible", still bounded by a hard cap for safety.
 */
export type ListWindowInput = {
  top?: number;
  full?: boolean;
};

export type ResolveListWindowOptions = {
  defaultTop?: number;
  hardCap?: number;
};

export type ListWindowResolved = {
  top: number;
  full: boolean;
  limit: number;
  hardCap: number;
  clamped: boolean;
};

function clampPositiveInt(raw: number | undefined, fallback: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || !Number.isInteger(raw) || raw < 1) {
    return fallback;
  }
  return raw;
}

/**
 * Resolve portable list-window input into an engine-ready limit.
 * Safety rule: limit never exceeds `hardCap` (including when `full=true`).
 */
export function resolveListWindow(
  input: ListWindowInput | undefined,
  options?: ResolveListWindowOptions,
): ListWindowResolved {
  const hardCap = clampPositiveInt(options?.hardCap, LIST_WINDOW_HARD_CAP);
  const defaultTopRaw = clampPositiveInt(options?.defaultTop, LIST_WINDOW_DEFAULT_TOP);
  const defaultTop = Math.min(defaultTopRaw, hardCap);

  if (input?.full === true) {
    return {
      top: hardCap,
      full: true,
      limit: hardCap,
      hardCap,
      clamped: false,
    };
  }

  const requestedTop = input?.top;
  const top = clampPositiveInt(requestedTop, defaultTop);
  const limit = Math.min(top, hardCap);
  const isRequestedValidNumber = typeof requestedTop === 'number' && Number.isFinite(requestedTop) && Number.isInteger(requestedTop);
  return {
    top,
    full: false,
    limit,
    hardCap,
    clamped: isRequestedValidNumber && requestedTop > hardCap,
  };
}

/** Apply a resolved list window to an array. */
export function applyListWindow<T>(items: readonly T[], window: ListWindowResolved): T[] {
  return items.slice(0, window.limit);
}
