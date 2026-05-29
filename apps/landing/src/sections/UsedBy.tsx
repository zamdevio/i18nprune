import { motion } from 'motion/react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  USED_BY_ITEMS,
  repeatUsedByItems,
  usedByRows,
  type UsedByItem,
} from '../constants/usedBy';

const MARQUEE_MAX_SEGMENT_REPEATS = 16;

function StackChip({ item, decorative = false }: { item: UsedByItem; decorative?: boolean }) {
  return (
    <div
      className="shrink-0 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-border/50 bg-card/55 backdrop-blur-sm hover:border-primary/35 transition-colors"
      {...(decorative ? { 'aria-hidden': true } : {})}
    >
      <img
        src={item.iconSrc}
        alt=""
        width={22}
        height={22}
        className={`used-by-brand-icon h-[22px] w-[22px] shrink-0 object-contain ${item.iconClass ?? ''}`}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <span className="font-display text-sm font-semibold text-foreground whitespace-nowrap">
        {item.label}
      </span>
    </div>
  );
}

function MarqueeSegment({ items }: { items: UsedByItem[] }) {
  return (
    <div className="used-by-marquee-segment flex w-max shrink-0 gap-3">
      {items.map((item) => (
        <StackChip key={item.id} item={item} decorative />
      ))}
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: UsedByItem[];
  direction: 'forward' | 'reverse';
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [segmentRepeats, setSegmentRepeats] = useState(4);

  const segmentItems = useMemo(
    () => repeatUsedByItems(items, segmentRepeats),
    [items, segmentRepeats],
  );

  useLayoutEffect(() => {
    const row = rowRef.current;
    const track = trackRef.current;
    if (!row || !track) return;

    const syncMarquee = () => {
      const minHalfWidth = row.clientWidth;
      const halfWidth = track.scrollWidth / 2;

      if (halfWidth < minHalfWidth && segmentRepeats < MARQUEE_MAX_SEGMENT_REPEATS) {
        setSegmentRepeats((count) => count + 1);
        return;
      }

      track.style.setProperty('--marquee-distance', `${halfWidth}px`);
    };

    syncMarquee();

    const observer = new ResizeObserver(syncMarquee);
    observer.observe(row);
    observer.observe(track);

    return () => observer.disconnect();
  }, [items, segmentRepeats]);

  const trackClass =
    direction === 'forward' ? 'used-by-marquee-track--forward' : 'used-by-marquee-track--reverse';

  return (
    <div
      ref={rowRef}
      className="used-by-marquee-row used-by-marquee-mask overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={trackRef}
        className={`used-by-marquee-track flex w-max gap-3 py-0.5 ${trackClass}`}
        style={{ ['--marquee-distance' as string]: '50%' }}
      >
        <MarqueeSegment items={segmentItems} />
        <div aria-hidden="true">
          <MarqueeSegment items={segmentItems} />
        </div>
      </div>
    </div>
  );
}

function StaticRows({ rows }: { rows: [UsedByItem[], UsedByItem[]] }) {
  return (
    <div className="space-y-3">
      {rows.map((row, rowIndex) => (
        <ul
          key={rowIndex}
          className="flex flex-wrap justify-center gap-3 list-none p-0 m-0"
        >
          {row.map((item) => (
            <li key={item.id}>
              <StackChip item={item} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export default function UsedBy() {
  const rows = usedByRows();

  return (
    <section
      id="used-by"
      className="section overflow-hidden py-16 sm:py-20"
      data-testid="used-by-section"
      aria-labelledby="used-by-heading"
    >
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" aria-hidden="true" />

      <div className="section-inner relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 sm:mb-12"
        >
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary/80 mb-3">
            Every runtime
          </div>
          <h2
            id="used-by-heading"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]"
          >
            Runs where{' '}
            <span className="stat-highlight">you ship.</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed text-balance">
            Ten curated stacks backed by repo fixtures — Vue, Nuxt, SvelteKit, Remix, Next, Vite, and the
            runtimes and CI hooks you already ship on.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="space-y-4 -mx-4 sm:mx-0"
          role="region"
          aria-label="Compatible runtimes, frameworks, and platforms"
        >
          <div className="used-by-animated space-y-4">
            <MarqueeRow items={rows[0]} direction="forward" />
            <MarqueeRow items={rows[1]} direction="reverse" />
          </div>
          <div className="used-by-static">
            <StaticRows rows={rows} />
          </div>
        </motion.div>

        <ul className="sr-only">
          {USED_BY_ITEMS.map((item) => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
