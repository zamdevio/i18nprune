import { t } from '../i18n';

export default function AboutRoute() {
  return (
    <section>
      <h2>{t('routes.about.heading')}</h2>
      <p>{t('routes.about.body')}</p>
    </section>
  );
}
