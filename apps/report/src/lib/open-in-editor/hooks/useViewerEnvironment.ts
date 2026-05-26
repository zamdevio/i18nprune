/// <reference lib="dom" />
import { useEffect, useState } from 'react';
import { detectViewerEnvironment, readViewerSignals } from '../viewer/detect.js';
import type { ViewerEnvironment } from '../types.js';

/** Reactive viewer environment from lightweight browser signals. */
export function useViewerEnvironment(): ViewerEnvironment {
  const [viewer, setViewer] = useState<ViewerEnvironment>(() =>
    detectViewerEnvironment(readViewerSignals()),
  );

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') return;

    const w = globalThis as Window & typeof globalThis;
    const narrow = w.matchMedia('(max-width: 719px)');
    const coarse = w.matchMedia('(pointer: coarse)');
    const fine = w.matchMedia('(pointer: fine)');

    const refresh = (): void => {
      setViewer(detectViewerEnvironment(readViewerSignals()));
    };

    refresh();
    narrow.addEventListener('change', refresh);
    coarse.addEventListener('change', refresh);
    fine.addEventListener('change', refresh);
    return () => {
      narrow.removeEventListener('change', refresh);
      coarse.removeEventListener('change', refresh);
      fine.removeEventListener('change', refresh);
    };
  }, []);

  return viewer;
}
