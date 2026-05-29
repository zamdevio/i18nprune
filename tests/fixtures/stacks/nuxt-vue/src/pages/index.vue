<script setup lang="ts">
import { t } from '../i18n';

const title = t('pages.home.title');
const lead = t('pages.home.lead');
</script>

<template>
  <section>
    <h1>{{ title }}</h1>
    <p>{{ lead }}</p>
  </section>
</template>
