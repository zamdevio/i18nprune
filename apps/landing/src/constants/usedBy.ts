export interface UsedByItem {
  id: string;
  label: string;
  /** Public URL under `/icons/` (brand SVG). */
  iconSrc: string;
  /** Optional chip icon modifier (e.g. theme-aware Next.js mark). */
  iconClass?: string;
}

/** Curated stacks with repo evidence (`tests/fixtures/stacks/`, apps, docs, or CI). */
export const USED_BY_ITEMS: UsedByItem[] = [
  { id: 'node', label: 'Node.js', iconSrc: '/icons/node.svg' },
  { id: 'vite', label: 'Vite', iconSrc: '/icons/vite.svg' },
  {
    id: 'next',
    label: 'Next.js',
    iconSrc: '/icons/nextjs.svg',
    iconClass: 'used-by-brand-icon--nextjs',
  },
  { id: 'vue', label: 'Vue', iconSrc: '/icons/vue.svg' },
  { id: 'nuxt', label: 'Nuxt', iconSrc: '/icons/nuxt.svg' },
  { id: 'sveltekit', label: 'SvelteKit', iconSrc: '/icons/sveltekit.svg', iconClass: 'used-by-brand-icon--sveltekit' },
  {
    id: 'remix',
    label: 'Remix',
    iconSrc: '/icons/remix.svg',
    iconClass: 'used-by-brand-icon--remix',
  },
  { id: 'github-actions', label: 'GitHub Actions', iconSrc: '/icons/github-actions.svg' },
  { id: 'cf-workers', label: 'Cloudflare Workers', iconSrc: '/icons/cloudflare-workers.svg' },
  { id: 'browser', label: 'Browser', iconSrc: '/icons/browser.svg' },
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
