# i18nprune docs site (`apps/docs`)

VitePress app for user-facing documentation. **Source of truth:** root `docs/` (topic pages); synced copy: `apps/docs/content/` (gitignored — run `pnpm docs:sync`).

**Custom home:** [`apps/docs/index.md`](./index.md) (YAML `layout: home`) is copied to `content/index.md` on sync — **not** sourced from `docs/README.md` (that file is skipped).

## Maintainer note: sidebar

VitePress navigation is **manual** in **`apps/docs/.vitepress/sidebar.ts`**. Whenever you add, rename, or delete pages under the synced **`docs/`** tree, update the sidebar in the **same PR** so readers can browse new hubs (especially under **Issues reference**). See also **[docs/agents/README.md](../../docs/agents/README.md)** (if present) / contributor docs.

## Theme

Default theme extensions live in **`.vitepress/theme/`** (`custom.css` + `index.ts`). Palette matches **landing / web** (`apps/landing/src/index.css`, `apps/web/src/styles.css`); tweak there in spirit when rebranding.

Phase 2 in the same file: **code block + tab strip + callout radius**, **frosted local nav**, **desktop sidebar edge**, **thin scrollbars** (webkit + Firefox `scrollbar-width`).

Phase 3: **fixed ambient background** (grid + mint glow + noise) injected for **all pages** via the theme `layout-top` slot (`index.ts` + `.i18n-docs-textures*` in `custom.css`). Tweak opacity in CSS if you want it calmer on long reads.

## Scripts

From repo root:

- `pnpm docs:sync` — `docs/` → `apps/docs/content/` (applies version tokens)
- `pnpm docs:sync:verify` — idempotent sync gate (CI)
- `pnpm docs:dev` — sync watch + VitePress dev
- `pnpm docs:build` — production build
- `pnpm docs:deploy` — build + Cloudflare Pages

## Version tokens

Markdown under `docs/` may use:

| Token | Becomes at sync |
|-------|-----------------|
| `__I18NPRUNE_VERSION__` | Root `package.json` `version` (e.g. `1.0.2`) |
| `__I18NPRUNE_TAG__` | `v` + that version (e.g. `v1.0.2`) |

Use tokens for **current release** examples (install pins, “currently on npm”, `git tag`). Pin a concrete historical version/tag only when documenting a specific past release (e.g. “sentinel repair shipped in v1.0.1”).

Do **not** confuse these with locale MT mask sentinels such as `__I18NPRUNE_MISSING__` — those are product strings and are not replaced by sync.

The VitePress nav version badge also reads root `package.json` directly.
