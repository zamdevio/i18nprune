import { t } from './i18n.js';

export function main(): string {
  return [t('auth.login'), t('auth.logout'), t('auth.register')].join(' ');
}
