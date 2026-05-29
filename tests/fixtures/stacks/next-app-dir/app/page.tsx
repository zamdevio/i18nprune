import { t } from './i18n';

export default function Page(): JSX.Element {
  return (
    <main>
      <h1>{t('app.title')}</h1>
      <p>{t('app.description')}</p>
      <a href="/start">{t('page.cta')}</a>
    </main>
  );
}
