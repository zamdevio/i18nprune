<script lang="ts">
  import { t } from './i18n';

  const copyright = t('footer.copyright');
  const privacy = t('footer.privacy');
</script>

<footer>
  <span>{copyright}</span>
  <a href="/privacy">{privacy}</a>
</footer>
