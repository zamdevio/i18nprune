import { useEffect, useState, useSyncExternalStore } from 'react';
import { getLandingHighlighter, landingShikiTheme } from '../lib/shikiHighlighter';

function subscribeTheme(onStoreChange: () => void) {
  const el = document.documentElement;
  const mo = new MutationObserver(onStoreChange);
  mo.observe(el, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('storage', onStoreChange);
  return () => {
    mo.disconnect();
    window.removeEventListener('storage', onStoreChange);
  };
}

function getThemeSnapshot() {
  return landingShikiTheme();
}

function getServerThemeSnapshot(): 'github-dark' | 'github-light' {
  return 'github-light';
}

type ShikiLang = 'bash' | 'typescript';

type Props = {
  code: string;
  lang: ShikiLang;
  className?: string;
  as?: 'span' | 'div';
};

/**
 * Syntax-highlighted snippet using Shiki (bash or typescript only — see `getLandingHighlighter`).
 * Re-renders when light/dark toggles.
 */
export default function ShikiCode({ code, lang, className = '', as: Tag = 'span' }: Props) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let alive = true;
    getLandingHighlighter().then((h) => {
      if (!alive) return;
      const out = h.codeToHtml(code, {
        lang,
        theme,
        structure: 'inline',
      });
      setHtml(out);
    });
    return () => {
      alive = false;
    };
  }, [code, lang, theme]);

  return (
    <Tag className={`shiki-shell inline-block max-w-full align-baseline ${className}`}>
      {html ? (
        <span dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span className="text-foreground/85 font-[inherit]">{code}</span>
      )}
    </Tag>
  );
}
