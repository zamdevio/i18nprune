import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import type { Metadata } from 'next'
import { GITHUB_REPO_URL } from '../../../packages/cli/src/constants/links'

const GITHUB_DOCS_TREE_BASE = `${GITHUB_REPO_URL}/tree/main/docs`

export const metadata: Metadata = {
  title: 'i18nprune Documentation',
  description:
    'Documentation for i18nprune — validate keys, sync locales, generate translations, and cleanup unused i18n paths.',
}

const navbar = (
  <Navbar logo={<b>i18nprune docs</b>} />
)

const footer = <Footer>i18nprune documentation © {new Date().getFullYear()}</Footer>

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase={GITHUB_DOCS_TREE_BASE}
          footer={footer}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </Layout>
      </body>
    </html>
  )
}
