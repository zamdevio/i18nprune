import type { ViewerEnvironment, ViewerRuntimeFamily } from '../types.js';

export type ViewerSignals = {
  platform: string;
  userAgent: string;
  isCoarsePointer: boolean;
  isNarrowViewport: boolean;
};

const NARROW_MAX_WIDTH_PX = 719;

/** Pure viewer classification from browser signals (no generator/policy). */
export function detectViewerEnvironment(signals: ViewerSignals): ViewerEnvironment {
  const { platform, userAgent, isCoarsePointer, isNarrowViewport } = signals;

  let family: ViewerRuntimeFamily = 'unknown';

  const win =
    platform === 'Win32' || /\bWindows NT\b/i.test(userAgent);
  const mac = /\bMac OS X\b|\bMacintosh\b/i.test(userAgent);
  const linux = platform === 'Linux' || /\bLinux\b/i.test(userAgent);

  if (win) {
    family = 'windows';
  } else if (mac) {
    family = 'darwin';
  } else if (linux) {
    family = 'linux';
  }

  return {
    family,
    isCoarsePointer,
    isNarrowViewport,
  };
}

/** Read current browser signals (call from hooks or tests). */
export function readViewerSignals(): ViewerSignals {
  if (typeof navigator === 'undefined' || typeof globalThis.matchMedia !== 'function') {
    return {
      platform: '',
      userAgent: '',
      isCoarsePointer: false,
      isNarrowViewport: false,
    };
  }

  const w = globalThis as Window & typeof globalThis;
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    isCoarsePointer: w.matchMedia('(pointer: coarse)').matches,
    isNarrowViewport: w.matchMedia(`(max-width: ${NARROW_MAX_WIDTH_PX}px)`).matches,
  };
}

export { NARROW_MAX_WIDTH_PX };
