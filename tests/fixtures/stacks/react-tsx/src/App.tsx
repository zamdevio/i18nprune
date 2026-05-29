import { t } from './i18n';

export function App(): JSX.Element {
  return (
    <main>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
    </main>
  );
}
