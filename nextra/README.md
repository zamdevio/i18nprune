# i18nprune documentation site

Next.js + [Nextra](https://nextra.site) app. **`content/` is generated** — edit markdown in the repository **`docs/`** folder only. Sync copies `../docs` → `content/`.

## Links

| Resource | URL |
|----------|-----|
| **Live docs** | [i18nprune.zamdev.dev](https://i18nprune.zamdev.dev) |
| **Repository** | [github.com/zamdevio/i18nprune](https://github.com/zamdevio/i18nprune) |
| **npm** | [npmjs.com/package/@zamdevio/i18nprune](https://www.npmjs.com/package/@zamdevio/i18nprune) |

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies (run inside `nextra/`) |
| `pnpm run sync` | Copy `../docs` → `content/` |
| `pnpm run dev` | Sync once, then dev server on port **8181** |
| `pnpm run build` | Sync + static export to `out/` (Pagefind in `postbuild`) |

From repo root, `pnpm docs:sync` runs `nextra/scripts/sync-content.js` (same copy as above).

## Deploy

Static output is `out/` after `pnpm run build`. Point Cloudflare Pages, Vercel, or any static host at that directory. Set the site URL to **https://i18nprune.zamdev.dev** (or your preview domain).

## Source of truth

- **Authoritative docs:** [`../docs`](../docs)
- **Edit on GitHub:** `docsRepositoryBase` in `app/layout.tsx` → `https://github.com/zamdevio/i18nprune/tree/main/docs`
