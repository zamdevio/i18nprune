<script lang="ts">
  import { t } from '$lib/i18n';
  import Nav from '$lib/Nav.svelte';
  import Footer from '$lib/Footer.svelte';

  const title = t('app.title');
  const tagline = t('app.tagline');
  const saveLabel = t('forms.save');
  const errorText = t('errors.load_failed');
</script>

<Nav />
<main>
  <h1>{title}</h1>
  <p>{tagline}</p>
  <p class="error">{errorText}</p>
  <button type="button">{saveLabel}</button>
</main>
<Footer />
