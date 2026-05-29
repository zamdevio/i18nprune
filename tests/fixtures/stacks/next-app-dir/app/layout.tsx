import { t } from './i18n';

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          {t('layout.skip')}
        </a>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
