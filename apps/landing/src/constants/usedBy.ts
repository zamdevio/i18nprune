export interface UsedByItem {
  id: string;
  label: string;
  /** Public URL under `/icons/used-by/` (brand SVG). */
  iconSrc: string;
  /** Optional chip icon modifier (e.g. theme-aware Next.js mark). */
  iconClass?: string;
}

/** Curated stacks with repo evidence (fixtures, apps, docs, or CI). */
export const USED_BY_ITEMS: UsedByItem[] = [
  { id: 'node', label: 'Node.js', iconSrc: '/icons/used-by/node.svg' },
  { id: 'vite', label: 'Vite', iconSrc: '/icons/used-by/vite.svg' },
  {
    id: 'next',
    label: 'Next.js',
    iconSrc: '/icons/used-by/nextjs.svg',
    iconClass: 'used-by-brand-icon--nextjs',
  },
  { id: 'github-actions', label: 'GitHub Actions', iconSrc: '/icons/used-by/github-actions.svg' },
  { id: 'cf-workers', label: 'Cloudflare Workers', iconSrc: '/icons/used-by/cloudflare-workers.svg' },
  { id: 'browser', label: 'Browser', iconSrc: '/icons/used-by/browser.svg' },
];

export function usedByRows(): [UsedByItem[], UsedByItem[]] {
  const mid = Math.ceil(USED_BY_ITEMS.length / 2);
  return [USED_BY_ITEMS.slice(0, mid), USED_BY_ITEMS.slice(mid)];
}

/** Repeat the same curated chips for marquee strip width (unique ids per tile). */
export function repeatUsedByItems(items: UsedByItem[], times: number): UsedByItem[] {
  const out: UsedByItem[] = [];
  for (let t = 0; t < times; t++) {
    for (const item of items) {
      out.push({ ...item, id: `${item.id}-r${t}` });
    }
  }
  return out;
}
