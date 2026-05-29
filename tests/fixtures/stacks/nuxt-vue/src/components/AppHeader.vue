<script setup lang="ts">
import { t } from '../i18n';

const brand = t('layout.brand');
const signIn = t('layout.signIn');
</script>

<template>
  <header>
    <span>{{ brand }}</span>
    <button type="button">{{ signIn }}</button>
  </header>
</template>
