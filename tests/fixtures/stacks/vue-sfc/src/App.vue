<script setup lang="ts">
import { t } from './i18n';

const title = t('app.title');
const subtitle = t('app.subtitle');
</script>

<template>
  <p>{{ title }} — {{ subtitle }}</p>
</template>
