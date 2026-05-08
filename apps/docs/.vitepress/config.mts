import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

import { sidebar } from './sidebar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  title: 'i18nprune',
  description: 'Docs for I18nprune repo',
  srcDir: 'content',
  vite: {
    publicDir: resolve(__dirname, 'public')
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
      { text: 'Config', link: '/config/' },
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
