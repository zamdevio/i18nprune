import { t } from './i18n.js';

export function main(): string {
  return [t('app.title'), t('app.greeting'), t('app.subtitle')].join(' ');
}
