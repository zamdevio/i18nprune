import { t } from './i18n.js';

export function authActions(): string {
  return [t('auth.reset'), t('auth.register')].join(' · ');
}
