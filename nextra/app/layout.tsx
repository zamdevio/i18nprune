import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import type { Metadata } from 'next'

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
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/zamdevio/i18nprune/tree/main/docs"
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
