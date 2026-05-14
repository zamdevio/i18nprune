import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import './custom.css'

/** Fixed decorative layers (grid + glow + noise); see `custom.css`. */
function layoutTextures() {
  return h('div', { class: 'i18n-docs-textures', 'aria-hidden': 'true' }, [
    h('div', { class: 'i18n-docs-textures__grid' }),
    h('div', { class: 'i18n-docs-textures__glow' }),
    h('div', { class: 'i18n-docs-textures__noise' }),
  ])
}

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-top': layoutTextures,
    }),
} satisfies Theme
