import { t } from '../i18n';

export function AuthBanner(): JSX.Element {
  return (
    <aside>
      <p>{t('auth.sign_in_prompt')}</p>
      <a href="/login">{t('auth.login')}</a>
    </aside>
  );
}
