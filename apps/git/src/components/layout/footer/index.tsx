import { SyncStatus } from '../sync-status';
import styles from './index.module.css';

const LINKS = [
  { label: 'Product', href: 'https://i18nprune.dev' },
  { label: 'Docs', href: 'https://docs.i18nprune.dev' },
  { label: 'Releases', href: 'https://releases.i18nprune.dev' },
  { label: 'GitHub', href: 'https://github.com/zamdevio/i18nprune' },
] as const;

interface SiteFooterProps {
  syncedAt?: string;
}

export function SiteFooter({ syncedAt }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.meta}>
          <p className={styles.copy}>© {new Date().getFullYear()} i18nprune — git analytics</p>
          {syncedAt ?
            <SyncStatus syncedAt={syncedAt} className={styles.sync} />
          : null}
        </div>
        <nav className={styles.links} aria-label="Ecosystem links">
          <a href="/sitemap.xml" className={styles.link}>
            Sitemap
          </a>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
