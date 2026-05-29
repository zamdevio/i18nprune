import { t } from './i18n';
import { AuthBanner } from './components/AuthBanner';
import { MarketingStrip } from './components/MarketingStrip';
import { SettingsLink } from './components/SettingsLink';

export default function RootLayout({ children }: { children: unknown }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          {t('layout.skip')}
        </a>
        <header>
          <SettingsLink />
          <MarketingStrip />
        </header>
        <AuthBanner />
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
