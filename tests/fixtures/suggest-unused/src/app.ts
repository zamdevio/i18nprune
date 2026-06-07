import { t } from './i18n.js';

export function appLine(): string {
  return `${t('app.title')} ${t('app.greeting')}`;
}
