<script lang="ts">
  import { t } from './i18n';

  const home = t('nav.home');
  const settings = t('nav.settings');
</script>

<nav>
  <a href="/">{home}</a>
  <a href="/settings">{settings}</a>
</nav>
