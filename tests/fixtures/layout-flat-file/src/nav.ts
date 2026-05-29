import { t } from './i18n.js';

export function navLabels(): string {
  return [t('nav.home'), t('nav.about'), t('nav.contact')].join(' | ');
}
