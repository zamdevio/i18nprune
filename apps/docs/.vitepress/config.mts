import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

import { sidebar } from './sidebar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function docsChunkByPackage(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('/@shikijs/langs/')) {
    const lang = id.match(/@shikijs\/langs\/([^/.]+)/)?.[1]
    return lang ? `vendor-shiki-lang-${lang}` : 'vendor-shiki-langs'
  }
  const match = id.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/)
  const pkg = match?.[1]
  if (!pkg) return undefined
  if (pkg === 'motion' || pkg === 'shiki') return undefined
  if (pkg === 'vue' || pkg === '@vue/runtime-core' || pkg === '@vue/runtime-dom') return 'vendor-vue'
  if (pkg === 'vitepress') return 'vendor-vitepress'
  return `vendor-${pkg.replace('@', '').replace('/', '-')}`
}

export default defineConfig({
  title: 'i18nprune',
  description: 'Docs for I18nprune repo',
  appearance: true,
  srcDir: 'content',
  vite: {
    publicDir: resolve(__dirname, 'public'),
    build: {
      rollupOptions: {
        output: {
          manualChunks: docsChunkByPackage,
        },
      },
    },
  },
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    logo: '/i18nprune.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Onboarding', link: '/onboarding' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Issues', link: '/issues/' },
      {
        text: 'More',
        items: [
          { text: 'Performance', link: '/performance/' },
          { text: 'Exports (API)', link: '/exports/' },
          { text: 'Architecture', link: '/architecture/' },
          { text: 'Agents', link: '/agents/' },
        ],
      },
    ],
    sidebar,
    search: {
      provider: 'local',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/zamdevio/i18nprune' }],
  },
})
