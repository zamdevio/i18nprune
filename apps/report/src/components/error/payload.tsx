import type { ReactNode } from 'react';
import type { PayloadErrorKind } from '../../data/loader/index.js';

export type PayloadErrorScreenProps = {
  kind: PayloadErrorKind;
  message: string;
  detail?: string;
};

export function PayloadErrorScreen({
  kind,
  message,
  detail,
  children,
}: PayloadErrorScreenProps & { children?: ReactNode }): JSX.Element {
  const kindLabel =
    kind === 'missing' ?
      'Missing payload'
    : kind === 'parse' ?
      'Invalid JSON'
    : kind === 'version' ?
      'Unsupported schema version'
    : 'Schema mismatch';

  return (
    <div className="app-root">
      <main className="app-main">
        <div className="card">
          <h1 className="page-title">Report data could not be loaded</h1>
          <p className="badge" style={{ marginBottom: '0.75rem' }}>
            {kindLabel}
          </p>
          <p style={{ color: 'var(--fg-muted)' }}>{message}</p>
          {detail ?
            <pre
              className="mono"
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'color-mix(in srgb, var(--bg) 88%, var(--border))',
                borderRadius: 'var(--radius)',
                overflow: 'auto',
                maxHeight: '12rem',
                fontSize: '0.78rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {detail}
            </pre>
          : null}
          <p className="mono" style={{ marginTop: '1rem' }}>
            {kind === 'version' ?
              <>
                Use the same i18nprune version for JSON and HTML, or regenerate:{' '}
                <code>i18nprune report --format html --out &lt;file&gt;</code>.
              </>
            : <>
                Regenerate with <code>i18nprune report --format html --out &lt;file&gt;</code> and confirm
                the inline JSON script was written.
              </>
            }
          </p>
          {children ?
            <div style={{ marginTop: '1.5rem' }}>{children}</div>
          : null}
        </div>
      </main>
    </div>
  );
}
