import { t } from '../i18n';

export function SettingsLink(): JSX.Element {
  return <a href="/settings">{t('settings.open')}</a>;
}
