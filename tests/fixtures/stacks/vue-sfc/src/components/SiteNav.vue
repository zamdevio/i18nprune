<script setup lang="ts">
import { t } from '../i18n';

const home = t('nav.home');
const about = t('nav.about');
</script>

<template>
  <nav>{{ home }} · {{ about }}</nav>
</template>
