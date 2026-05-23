import { ExternalLink } from 'lucide-react';
import { ECOSYSTEM_LINKS } from '../../constants/index.js';

const FOOTER_LINKS = [
  ECOSYSTEM_LINKS.landing,
  ECOSYSTEM_LINKS.docs,
  ECOSYSTEM_LINKS.worker,
  ECOSYSTEM_LINKS.report,
  ECOSYSTEM_LINKS.docsShare,
  ECOSYSTEM_LINKS.github,
] as const;

export function EcosystemFooter() {
  return (
    <footer className="ecosystem-footer">
      <p className="ecosystem-footer__lead">
        Same <code>@i18nprune/core</code> engine as the CLI, IDE extension, report viewer, and edge worker — this app is the
        browser-hosted workspace.
      </p>
      <nav className="ecosystem-footer__grid" aria-label="Ecosystem">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.id}
            className="ecosystem-btn"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ecosystem-btn__text">
              <span className="ecosystem-btn__label">{link.label}</span>
              {link.description ? <span className="ecosystem-btn__desc">{link.description}</span> : null}
            </span>
            <ExternalLink size={15} aria-hidden className="ecosystem-btn__icon" />
          </a>
        ))}
      </nav>
    </footer>
  );
}
