# i18nprune docs site (`apps/docs`)

## Maintainer note: sidebar

VitePress navigation is **manual** in **`apps/docs/.vitepress/sidebar.ts`**. Whenever you add, rename, or delete pages under the synced **`docs/`** tree, update the sidebar in the **same PR** so readers can browse new hubs (especially under **Issues reference**). See also **[docs/agents/README.md](../../docs/agents/README.md)**.

## Theme

Default theme extensions live in **`.vitepress/theme/`** (`custom.css` + `index.ts`). Palette matches **landing / web** (`apps/landing/src/index.css`, `apps/web/src/styles.css`); tweak there in spirit when rebranding.

Phase 2 in the same file: **code block + tab strip + callout radius**, **frosted local nav**, **desktop sidebar edge**, **thin scrollbars** (webkit + Firefox `scrollbar-width`).

Phase 3: **fixed ambient background** (grid + mint glow + noise) injected for **all pages** via the theme `layout-top` slot (`index.ts` + `.i18n-docs-textures*` in `custom.css`). Tweak opacity in CSS if you want it calmer on long reads.

---

# i18nprune docs2 (planned migration sandbox)

`apps/docs2` is a **planning/sandbox app** for the deferred docs-site migration:

- target tooling: **VitePress `@next`**
- source of truth: root `docs/`
- sync path: `docs/` → `apps/docs2/content/` (same pattern as `apps/docs`)

This does **not** replace `apps/docs` yet.

## Scripts

- `pnpm --filter @i18nprune/docs2 sync`
- `pnpm --filter @i18nprune/docs2 dev`
- `pnpm --filter @i18nprune/docs2 build`
