import { t } from '../i18n';

export function MarketingStrip(): JSX.Element {
  return (
    <div className="marketing">
      <strong>{t('marketing.headline')}</strong>
      <span>{t('marketing.offer')}</span>
    </div>
  );
}
