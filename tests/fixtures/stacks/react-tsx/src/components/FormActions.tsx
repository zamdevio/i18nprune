import { t } from '../i18n';

export function FormActions() {
  return (
    <div>
      <button type="submit">{t('actions.save')}</button>
      <button type="button">{t('actions.cancel')}</button>
    </div>
  );
}
