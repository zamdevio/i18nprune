import { t } from '../i18n.js';

export function helpLinks(): string {
  return [t('help.faq'), t('help.contact'), t('help.docs')].join(' | ');
}
