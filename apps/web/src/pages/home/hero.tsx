import type { RefObject } from 'react';
import { FolderOpen, Settings } from 'lucide-react';

type Props = {
  zipInputRef: RefObject<HTMLInputElement>;
  dirInputRef: RefObject<HTMLInputElement>;
  onZipInputChange: (files: FileList | null) => void;
  onDirInputChange: (files: FileList | null) => void;
};

export function Hero({ zipInputRef, dirInputRef, onZipInputChange, onDirInputChange }: Props) {
  return (
    <section className="hero-card">
      <h1>Hosted workspace</h1>
      <p className="muted">
        One browser surface of the i18nprune stack — same <code>@i18nprune/core</code> envelopes as the CLI and worker.
        Upload a zip or folder, run <strong>local</strong> in-browser or <strong>remote</strong> against your worker, then
        share with <strong>Copy link</strong> (<code>#/workspace?id=…</code>).
      </p>
      <div className="home-actions">
        <button type="button" className="primary" onClick={() => zipInputRef.current?.click()}>
          Choose .zip
        </button>
        <button type="button" onClick={() => dirInputRef.current?.click()}>
          <FolderOpen size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Choose folder
        </button>
        <a className="btn-link" href="#/settings">
          <Settings size={16} aria-hidden style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Settings
        </a>
      </div>
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => {
          onZipInputChange(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={dirInputRef}
        type="file"
        hidden
        multiple
        // @ts-expect-error webkitdirectory is valid in browsers
        webkitdirectory=""
        onChange={(e) => {
          onDirInputChange(e.target.files);
          e.target.value = '';
        }}
      />
    </section>
  );
}
