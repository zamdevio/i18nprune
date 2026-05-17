import { useEffect, useRef, useState } from 'react';

interface Options {
  /** Final number to count up to */
  to: number;
  /** Animation duration in ms */
  duration?: number;
  /** Number of decimal places to keep */
  decimals?: number;
  /** Whether to only run once when entering viewport */
  once?: boolean;
}

/**
 * Count-up animation triggered by IntersectionObserver.
 * Respects prefers-reduced-motion (sets final value instantly).
 */
export function useCountUp({ to, duration = 1400, decimals = 0, once = true }: Options) {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(to);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && (!once || !startedRef.current)) {
            startedRef.current = true;
            const start = performance.now();
            const animate = (t: number) => {
              const elapsed = t - start;
              const progress = Math.min(elapsed / duration, 1);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(to * eased);
              if (progress < 1) requestAnimationFrame(animate);
              else setValue(to);
            };
            requestAnimationFrame(animate);
            if (once) obs.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration, once]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return { ref, value, display };
}
