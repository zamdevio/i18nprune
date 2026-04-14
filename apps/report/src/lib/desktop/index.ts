/// <reference lib="dom" />
import { useEffect, useState } from 'react';

/** Desktop / fine-pointer heuristic for showing editor deep-link controls. */
export function useDesktopReportChrome(): boolean {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const w = globalThis as unknown as Window & typeof globalThis;
    if (typeof w.matchMedia !== 'function') return;
    const mq = w.matchMedia('(min-width: 720px)');
    const evaluate = (): void => {
      const fine = w.matchMedia('(pointer: fine)').matches;
      const coarse = w.matchMedia('(pointer: coarse)').matches;
      const wide = mq.matches;
      setOk(wide && fine && !coarse);
    };
    evaluate();
    mq.addEventListener('change', evaluate);
    w.matchMedia('(pointer: fine)').addEventListener('change', evaluate);
    w.matchMedia('(pointer: coarse)').addEventListener('change', evaluate);
    return () => {
      mq.removeEventListener('change', evaluate);
      w.matchMedia('(pointer: fine)').removeEventListener('change', evaluate);
      w.matchMedia('(pointer: coarse)').removeEventListener('change', evaluate);
    };
  }, []);

  return ok;
}
