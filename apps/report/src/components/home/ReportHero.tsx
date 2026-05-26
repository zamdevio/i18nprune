import { FileJson, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { REPORT_SHARE_DOCS_LINK } from '../../constants/ecosystemSurfaces.js';

type Props = {
  onChooseZip: () => void;
  onChooseJson: () => void;
};

export function ReportHero({ onChooseZip, onChooseJson }: Props): JSX.Element {
  return (
    <section className="hero-card">
      <h1>Hosted report</h1>
      <p className="muted">
        One browser surface for i18nprune project reports — same <code className="mono">@i18nprune/core</code> document
        shape as <code className="mono">i18nprune report --format json</code> and the worker. Import prepared JSON,
        process a project <strong>.zip</strong> in-browser or on your worker, then share with{' '}
        <strong>Copy link</strong> (<code className="mono">#/?id=…</code>). See{' '}
        <a href={REPORT_SHARE_DOCS_LINK} target="_blank" rel="noopener noreferrer">
          share docs
        </a>
        .
      </p>
      <div className="home-actions">
        <button type="button" className="primary" onClick={onChooseZip}>
          Choose .zip
        </button>
        <button type="button" onClick={onChooseJson}>
          <FileJson size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Choose Json
        </button>
        <Link className="btn-link" to="/settings">
          <Settings size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Settings
        </Link>
      </div>
    </section>
  );
}
