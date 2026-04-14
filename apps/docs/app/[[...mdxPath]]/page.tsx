import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'
import HomePage from '../components/HomePage'
import Link from 'next/link'

export const dynamic = 'force-static'
export const dynamicParams = false

export const generateStaticParams = async () => {
  const params = await generateStaticParamsFor('mdxPath')()
  const allParams = [
    { mdxPath: [] },
    ...params.filter((param) => {
      const mdxPath = param.mdxPath
      return mdxPath && Array.isArray(mdxPath) && mdxPath.length > 0
    }),
  ]
  return allParams
}

export async function generateMetadata(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params

  if (!params.mdxPath || params.mdxPath.length === 0) {
    return {
      title: 'i18nprune Documentation',
      description: 'Documentation for the i18nprune CLI',
    }
  }

  try {
    const { metadata } = await importPage(params.mdxPath)
    return metadata
  } catch {
    return {
      title: 'Page not found — i18nprune',
      description: 'The requested page could not be found',
    }
  }
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params

  if (!params.mdxPath || params.mdxPath.length === 0) {
    return <HomePage />
  }

  try {
    const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath)

    return (
      <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
        <MDXContent {...props} params={params} />
      </Wrapper>
    )
  } catch (error) {
    console.error('Error loading page:', error)
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Page not found</h1>
        <p>The requested page could not be loaded.</p>
        <Link href="/">Go to home</Link>
      </div>
    )
  }
}
