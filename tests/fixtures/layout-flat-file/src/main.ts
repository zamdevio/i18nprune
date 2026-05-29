import { t } from './i18n.js';

export function main(): string {
  return [t('app.title'), t('app.cta'), t('app.tagline')].join(' — ');
}
