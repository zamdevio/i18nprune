'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '3rem 2rem',
        textAlign: 'center',
        flex: 1,
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '700',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          i18nprune documentation
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: '#666',
            marginBottom: '3rem',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 3rem',
          }}
        >
          CLI reference for validating keys, syncing locale shape, generating translations, quality
          and review reports, and cleaning unused paths — with{' '}
          <code style={{ fontSize: '0.95em' }}>--json</code> for automation.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/README"
            style={{
              display: 'inline-block',
              padding: '1rem 2.5rem',
              backgroundColor: '#0d9488',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(13, 148, 136, 0.35)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.backgroundColor = '#0f766e'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(13, 148, 136, 0.45)'
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.backgroundColor = '#0d9488'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(13, 148, 136, 0.35)'
            }}
          >
            Read documentation
          </Link>
        </div>
      </div>
    </div>
  )
}
