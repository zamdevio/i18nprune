import { t } from '../i18n.js';

export function statsLine(): string {
  return [t('widgets.stats.views'), t('widgets.stats.users'), t('widgets.stats.sessions')].join(' · ');
}
