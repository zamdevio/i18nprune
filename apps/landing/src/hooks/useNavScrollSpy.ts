import { useEffect, useState } from 'react';

const LINE = 88; /** px from viewport top — activation line = scrollY + LINE */

function elementDocumentTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

/** True while we’re still in the hero band (matches header “no pill” + rail “Intro”). */
function inHeroScrollBand(scrollY: number, introId: string): boolean {
  const hero = document.getElementById(introId);
  if (!hero) return scrollY < 120;
  const h = (hero as HTMLElement).offsetHeight;
  return scrollY < Math.max(120, h * 0.36);
}

/**
 * Among primary sections whose **document top** is at or above the activation line,
 * pick the one with the **largest** document top (the deepest section start we’ve passed).
 * This matches visual “current section” when nav order ≠ DOM order.
 */
export function pickActivePrimaryId(
  primaryIds: readonly string[],
  scrollY: number,
  linePx: number,
): string | null {
  const lineY = scrollY + linePx;
  let best: string | null = null;
  let bestTop = -Infinity;
  for (const id of primaryIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = elementDocumentTop(el as HTMLElement);
    if (top <= lineY && top > bestTop) {
      bestTop = top;
      best = id;
    }
  }
  return best;
}

/**
 * Header: no pill in the hero band; then same primary logic as the rail.
 */
export function useHeaderPrimaryActive(primaryIds: readonly string[], introId = 'top'): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const y = window.scrollY;
      if (inHeroScrollBand(y, introId)) {
        setActive(null);
        return;
      }
      setActive(pickActivePrimaryId(primaryIds, y, LINE));
    };

    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    return () => {
      window.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
    };
  }, [primaryIds, introId]);

  return active;
}

/**
 * Rail: Intro in the hero band; then same `pickActivePrimaryId` as the header.
 */
export function usePageRailActive(
  primaryIds: readonly string[],
  introId: string = 'top',
): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const y = window.scrollY;
      if (inHeroScrollBand(y, introId)) {
        setActive(introId);
        return;
      }
      setActive(pickActivePrimaryId(primaryIds, y, LINE));
    };

    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    return () => {
      window.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
    };
  }, [primaryIds, introId]);

  return active;
}
