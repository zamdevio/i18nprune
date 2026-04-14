import React from 'react';

export type ErrorScreenProps = {
  title: string;
  message: string;
};

export function ErrorScreen({ title, message }: ErrorScreenProps): JSX.Element {
  return (
    <div className="app-root">
      <main className="app-main">
        <div className="card">
          <h1 className="page-title">{title}</h1>
          <p style={{ color: 'var(--fg-muted)' }}>{message}</p>
          <p className="mono">
            Regenerate with <code>i18nprune report --format html --out &lt;file&gt;</code> and confirm payload
            injection succeeded.
          </p>
        </div>
      </main>
    </div>
  );
}
