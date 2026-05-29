import { t } from '../i18n';

export function Sidebar() {
  return (
    <aside>
      <a href="/">{t('sidebar.dashboard')}</a>
      <a href="/settings">{t('sidebar.settings')}</a>
    </aside>
  );
}
