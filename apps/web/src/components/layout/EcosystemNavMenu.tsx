import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { ECOSYSTEM_NAV_LINKS } from '../../lib/constants/ecosystemLinks';

export function EcosystemNavMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="ecosystem-nav" ref={rootRef}>
      <button
        type="button"
        className="runtime-header__nav-link ecosystem-nav__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        Ecosystem
        <ExternalLink size={14} aria-hidden className="ecosystem-nav__icon" />
      </button>
      {open ? (
        <div className="ecosystem-nav__menu" role="menu">
          {ECOSYSTEM_NAV_LINKS.map((link) => (
            <a
              key={link.id}
              role="menuitem"
              className="ecosystem-nav__item"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <span className="ecosystem-nav__item-label">{link.label}</span>
              {link.description ? <span className="ecosystem-nav__item-desc">{link.description}</span> : null}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
