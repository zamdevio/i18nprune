import { useEffect, useRef, useState } from 'react';
import type { EcosystemNavMenuProps } from '../../types/nav/index.js';

function IconChevron(): JSX.Element {
  return (
    <svg
      className="ecosystem-nav__chevron"
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconExternal(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function EcosystemNavMenu({ links }: EcosystemNavMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
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
        <IconChevron />
      </button>
      {open ?
        <div className="ecosystem-nav__menu" role="menu">
          {links.map((link) => (
            <a
              key={link.id}
              role="menuitem"
              className="ecosystem-nav__item"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <span className="ecosystem-nav__item-text">
                <span className="ecosystem-nav__item-label">{link.label}</span>
                {link.description ?
                  <span className="ecosystem-nav__item-desc">{link.description}</span>
                : null}
              </span>
              <IconExternal />
            </a>
          ))}
        </div>
      : null}
    </div>
  );
}
