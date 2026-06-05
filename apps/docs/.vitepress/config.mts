import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderRobotsTxtPreset } from '@i18nprune/seo'
import { syncWebPublicAssets } from '@i18nprune/seo/assets/sync'
import { defineConfig } from 'vitepress'

import { transformDocsHead } from './seo.js'
import { sidebar } from './sidebar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, 'public')

writeFileSync(resolve(publicDir, 'robots.txt'), renderRobotsTxtPreset('docs'), 'utf8')
syncWebPublicAssets({
  surface: 'docs',
  publicDir,
  functionsDir: resolve(__dirname, '../functions'),
})

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
  description:
    'Documentation for i18nprune — validate, sync, generate, and maintain locale files with the CLI and SDK.',
  lang: 'en-US',
  appearance: true,
  srcDir: 'content',
  cleanUrls: true,
  ignoreDeadLinks: true,
  sitemap: {
    hostname: 'https://docs.i18nprune.dev',
  },
  transformHead: transformDocsHead,
  vite: {
    publicDir,
    build: {
      rollupOptions: {
        output: {
          manualChunks: docsChunkByPackage,
        },
      },
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    ['meta', { name: 'theme-color', content: '#04140f' }],
  ],
  themeConfig: {
    logo: '/i18nprune.svg',
    nav: [
      { text: 'Onboarding', link: '/onboarding/' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Issues', link: '/issues/' },
      {
        text: 'More',
        items: [
          { text: 'Performance', link: '/performance' },
          { text: 'Architecture', link: '/architecture/' },
          { text: 'Configuration', link: '/config/' },
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
