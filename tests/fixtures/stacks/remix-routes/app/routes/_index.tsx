import { t } from '../i18n';

export default function IndexRoute() {
  return (
    <main>
      <h1>{t('routes.index.title')}</h1>
      <p>{t('routes.index.subtitle')}</p>
    </main>
  );
}
