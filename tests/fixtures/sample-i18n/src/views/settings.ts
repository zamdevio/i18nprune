import { t } from '../i18n.js';

export function settingsLabels(): string {
  return [t('settings.profile'), t('settings.security'), t('settings.notifications')].join(', ');
}
